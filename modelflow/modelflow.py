import sys
import os
import pathlib
import copy
import json
import re
import inspect
import time
import pandas as pd

numba_installed = False
try:
    from numba import jit  # NOQA
    numba_installed = True
except Exception:
    print("Note: Optional numba not installed")


def get_params_and_initial_states(scenario, models):
    """Gets all of the parameters that can be tweaked by the user interface

    Args:
        scenario (dict): Dictionary containing all the models in the scenario
        models (list): The list of all possible model classes

    Returns:
        list: A list of dictionaries with info about the parameters
    """
    model_map = {}
    for model in models:
        model_map[model.__class__.__name__] = model

    for model in scenario['models']:
        if model['model'] not in model_map:
            raise Exception(f"{model['model']} not in model list!")
        model['model'] = model_map[model['model']]

    # params_dict = {}
    all_params = []
    initial_states = []
    # data = None
    i = 0
    for model_info in scenario['models']:
        model = model_info['model']
        if 'params' in model.definition:
            for param in model.definition['params']:
                param['new_key'] = model.__class__.__name__ + \
                    '_params_' + param['key']
                param['agent'] = model.__class__.__name__
                param['index'] = i
                all_params.append(param)
                i += 1

        if 'states' in model.definition:
            for state in model.definition['states']:
                initial_states.append(dict(
                    new_key=f"initial_state_{state['key']}",
                    value=state['value']
                ))
                # params_dict[model.__class__.__name__+ '_params_' + param['key']] = param

        # if hasattr(model, 'load_data'):
        #     print(f"inside has data {model.__class__.__name__}")
        #     data = model.__class__.load_data()

    return dict(params=all_params, initial_states=initial_states)


def run_sim(scenario, models, should_output_deltas=False, use_numba=False, force_fresh_run=False):
    """Runs the simulation

    Args:
        scenario (dict): Dictionary containing all the models in the scenario
        models (list): The list of all possible model classes
        should_output_deltas (bool): Whether to store the deltas per state per model
        use_numba (bool): Whether to use the C-optimized numba function or not
        force_fresh_run (bool): Run with no caching of arguments or generated code
    """
    if not numba_installed and use_numba:
        print("WARNING: Not running with numba because numba is not installed")
        use_numba = False

    tsall0 = time.time()
    model_map = {}
    for model in models:
        model_map[model.__class__.__name__] = model

    count_dict = {}
    for model in scenario['models']:
        if model['model'] not in model_map:
            raise Exception(f"{model['model']} not in model list!")

        count_key = 'count_' + model['model']
        if 'count' in model:
            count_dict[count_key] = model['count']
        else:
            count_dict[count_key] = 1

        # TODO: Don't like how we change the types here. This is kinda confusing
        model['model'] = model_map[model['model']]

    params_dict = {}
    initial_states_dict = {}
    data_dict = {}
    for model_info in scenario['models']:
        model = model_info['model']
        if 'params' in model.definition:
            for param in model.definition['params']:
                params_dict[model.__class__.__name__ +
                            '_params_' + param['key']] = param

        if hasattr(model, 'load_data'):
            data_dict[f"{model.__class__.__name__}_data"] = model.__class__.load_data()

        if 'states' in model.definition:
            for state in model.definition['states']:
                initial_states_dict[f"initial_state_{state['key']}"] = state['value']

    override_params_dict = {}
    if 'params' in scenario:
        for item in scenario['params']:
            override_params_dict[item['new_key']] = item['value']

    # TODO: Support multiple data
    # for k, v in data_dict.items():
    #     all_args.append(f'{k}_data')
    #     if not is_sweep:
    #         all_arg_vals.append(v)

    args = None
    should_gen = True
    abs_dir = pathlib.Path(__file__).parent
    # TODO: Do not hardcode
    examples_dir = os.path.join(abs_dir.parent, 'examples')

    arg_cachepath = os.path.join(abs_dir, 'args_cache.json')

    gen_name = get_gen_name(should_output_deltas, use_numba)
    gen_path = os.path.join(abs_dir, f'{gen_name}.py')
    if os.path.exists(arg_cachepath) and not force_fresh_run:
        file_list = []
        times = []
        for root, _, filenames in os.walk(examples_dir):
            for filename in filenames:
                if '.py' in filename:
                    file_list.append(os.path.join(root, filename))
        for filepath in file_list:
            if os.path.isfile(filepath):
                times.append(os.path.getmtime(filepath))

        newest_time = list(sorted(times))[-1]
        if newest_time < os.path.getmtime(arg_cachepath):
            if os.path.exists(gen_path):
                should_gen = False

        with open(arg_cachepath, 'r') as f:
            args = json.load(f)

    if force_fresh_run or should_gen or not os.path.exists(arg_cachepath) or not os.path.exists(gen_path):
        print("Generating args...")
        args = generate_numba_compatible_code(
            scenario['models'],
            scenario['run_for_steps'],
            count_dict,
            no_outputs=False,  # Used for sweeping
            is_sweep=False,
            should_output_deltas=should_output_deltas,
            use_numba=use_numba
        )

        with open(arg_cachepath, 'w') as f:
            json.dump(args, f)
    else:
        print("Using args cache...")

    arg_vals = []
    for arg in args:
        if arg in override_params_dict:
            arg_vals.append(override_params_dict[arg])
        elif arg in params_dict:
            arg_vals.append(params_dict[arg]['value'])
        elif arg in initial_states_dict:
            arg_vals.append(initial_states_dict[arg])
        elif arg in data_dict:
            arg_vals.append(data_dict[arg])
        elif arg in count_dict:
            arg_vals.append(count_dict[arg])
        else:
            raise Exception(f"Could not find {arg} in params, state or count dict")

    sys.path.insert(0, str(abs_dir))
    rstep = __import__(gen_name).rstep
    num_steps = scenario['run_for_steps']
    ts0 = time.time()
    cost_and_outputs = rstep(num_steps, *arg_vals)
    ts1 = time.time()

    all_state_keys = list(sorted(list(initial_states_dict.keys())))
    new_deltas = []
    for key in all_state_keys:
        new_deltas.append(key+'_deltas')

    output_states = {}
    for k, v in zip(all_state_keys, cost_and_outputs[1:]):
        key_name = k.replace('initial_', '')
        newdata = v.tolist()
        # newdata = []
        # for item in v:
        #     newdata.append(round_sig(item, sig=2))
        output_states[key_name] = {
            "label": key_name,
            "data": newdata
        }
    if should_output_deltas:
        delta_start = len(all_state_keys) + 1
        key_outputs = cost_and_outputs[delta_start].split(',')
        for i, key_output in enumerate(key_outputs):
            output_states[key_output] = {
                "label": key_output,
                "data": cost_and_outputs[delta_start + i + 1].tolist()
            }

    times = list(range(len(list(output_states.values())[0]['data'])))
    tsall1 = time.time()
    output = {
        "stats": {
            "use_numba": use_numba,
            "generating_numba": should_gen,
            "arg_cachepath": arg_cachepath,
            "gen_path": gen_path,
            "model": ts1 - ts0,
            "total": tsall1 - tsall0,
            "pre": ts0 - tsall0,
            "post": tsall1 - ts1
        },
        "cost": cost_and_outputs[0],
        "time": times,
        "output_states": output_states
    }
    # print(f"Model ran in {tsall1 - tsall0:.2} seconds")
    return output


def generate_numba_compatible_code(model_infos, num_steps, count_dict, no_outputs=False, is_sweep=False, should_output_deltas=False, use_numba=False):

    out = "# Generated Code\n"
    # TODO: Handle imports better
    out += "import numpy as np\n"
    out += "import math\n"
    if use_numba:
        out += "from numba import jit\n"
    out += "\n"
    out += "\n"

    all_params = {}
    params_dict = {}
    orig_params_dict = {}
    state_dict = {}
    data_dict = {}
    for model_info in model_infos:
        model = model_info['model']
        model_name = model.__class__.__name__
        params_dict[model_name] = {}
        if 'params' in model.definition:
            for param in model.definition['params']:
                params_dict[model_name][param['key']] = param['value']
                new_name = model_name + '_params_' + param['key']
                orig_params_dict[new_name] = param
                all_params[new_name] = param['value']

        if 'states' in model.definition:
            for state in model.definition['states']:
                # if state['key'] in state_dict:
                #     print(state['key'])
                state_dict[state['key']] = state['value']

        if hasattr(model, 'load_data'):
            data_dict[model.__class__.__name__] = model.__class__.load_data()

    for model_info in model_infos:
        model = model_info['model']
        # TODO: Rethink this
        if 'linked_output_states' in model.definition:
            for state in model.definition['linked_output_states']:
                if state not in state_dict:
                    state_dict[state] = 0

        if 'linked_input_states' in model.definition:
            for state in model.definition['linked_input_states']:
                if state not in state_dict:
                    state_dict[state] = 0

    all_states = {}
    function_lists = ''
    all_olines = ''
    all_costs = '\n    all_costs = 0\n'
    output_deltas_to_save = []
    for model_info in model_infos:
        model = model_info['model']
        model_name = model.__class__.__name__
        flines = inspect.getsource(model.run_step)
        # Exclude first two lines
        flines = '\n'.join(flines.split('\n')[2:])
        olines = ''
        if use_numba:
            olines += "@jit(nopython=True, cache=True)\n"

        if hasattr(model, 'cost'):
            clines = ''
            clines = inspect.getsource(model.cost)
            clines = clines.split('\n')[2:]
            new_lines = []
            for line in clines:
                if len(line.strip()) > 0:
                    if not line.strip()[0] == '#':
                        new_lines.append(line)
                else:
                    new_lines.append(line)
            clines = '\n'.join(new_lines)
            states_strs = re.findall(r'states\.\w*', clines)
            for state_str in states_strs:
                state_name = state_str.split('.')[1]
                clines = clines.replace(state_str, "state_" + state_name)

            param_strs = re.findall(r'params\.\w*', clines)
            for param_str in param_strs:
                new_name = model_name + "_" + param_str.replace(".", "_")
                clines = clines.replace(param_str, new_name)

            clines = clines.replace('    return ', 'all_costs += ')
            all_costs += f'    # {model_name} cost\n'
            all_costs += clines

        # match all io. , states.
        # TODO: io. seems like something that can be accidentally
        # used in something else, so make a more robust setup.
        states_strs = re.findall(r'states\.\w*', flines)
        states_strs += re.findall(r'io\.\w*', flines)
        new_states_set = set(["state_terminate_sim"])
        for state_str in states_strs:
            state_name = state_str.split('.')[1]
            new_name = "state_" + state_name
            new_states_set.add(new_name)
            flines = flines.replace(state_str, new_name)

            if not state_name in state_dict:
                # print(f"Could not find state {state_name}")
                continue

            all_states[new_name] = state_dict[state_name]

        new_state_strs = ', '.join(list(new_states_set))

        # match all params.
        new_params_set = set()
        param_strs = re.findall(r'params\.\w*', flines)
        for param_str in param_strs:
            param_name = param_str.split('.')[1]
            if param_name not in params_dict[model_name]:
                raise Exception(f"Found param not in dict {param_name}")

            new_name = param_str.replace(".", "_")
            new_name = model_name + "_" + new_name
            new_params_set.add(new_name)
            all_params[new_name] = params_dict[model_name][param_name]
            flines = flines.replace(param_str, new_name)

        flines += '\n'

        all_args = list(new_states_set) + list(new_params_set)
        outer_args = copy.deepcopy(all_args)
        if model_name in data_dict:
            # TODO: Support multiple data like we do for states/params
            all_args.append('data')
            outer_args.append(f'{model_name}_data')
        all_arg_strs = ','.join(all_args)
        all_out_strs = ','.join(outer_args)

        olines += f"def {model_name}({all_arg_strs}):\n"

        if should_output_deltas:
            for new_state in new_states_set:
                if not 'state_terminate_sim' in new_state:
                    # function_lists += f'        old_{new_state} = copy({new_state})\n'
                    function_lists += f'        old_{model_name}_{new_state} = {new_state}\n'

        # Ex: if there are 4 people, then we'd run the agend 4 times
        function_lists += f'        for _ in range(count_{model_name}):\n'
        function_lists += f'            {new_state_strs} = {model_name}({all_out_strs})\n'
        # function_lists += f'        {new_state_strs} = {model_name}({all_out_strs})\n'

        if should_output_deltas:
            for new_state in new_states_set:
                if not 'state_terminate_sim' in new_state:
                    output_deltas_to_save.append(f'{model_name}_{new_state}_deltas')
                    function_lists += f'        {model_name}_{new_state}_deltas[_i_] = {new_state} - old_{model_name}_{new_state}\n'
            function_lists += '\n'
        # TODO: Ensure this isn't inside some text
        flines = flines.replace('return', f'return {new_state_strs}')
        newlines = []
        for line in flines.split('\n'):
            newlines.append(line[4:])
        olines += '\n'.join(newlines)

        olines += f'    return {new_state_strs}\n\n\n'

        all_olines += olines

    # all_kwargs = []
    # for k, v in all_dicts.items():
    #     all_kwargs.append("{key}={value}")
    all_args = []
    # all_arg_vals = []
    exclude_sweep_params = []
    for k in sorted(list(all_params.keys())):
        if is_sweep:
            if 'min' in orig_params_dict[k] and 'max' in orig_params_dict[k]:
                all_args.append(k)
                exclude_sweep_params.append(k)
        else:
            all_args.append(k)
            # all_arg_vals.append(all_params[k])

    all_output_keys = []
    only_states = []
    all_state_keys = sorted(list(all_states.keys()))
    for k in all_state_keys:
        only_states.append(k.replace('state_', ''))
        if not no_outputs:
            all_output_keys.append(k+"_out")
        if not is_sweep:
            all_args.append(f"initial_{k}")
            # all_arg_vals.append(all_states[k])

    for k, v in data_dict.items():
        all_args.append(f'{k}_data')
        # all_arg_vals.append(v)

    all_args += list(sorted(list(count_dict.keys())))

    all_args_str = ",".join(all_args)

    out += all_olines
    if use_numba:
        out += "@jit(nopython=True, cache=True)\n"
    out += f"def rstep(num_steps,{all_args_str}):\n"

    # Define the non-sweep parameters
    if is_sweep:
        for key in orig_params_dict:
            if key not in exclude_sweep_params:
                out += f"    {key} = {orig_params_dict[key]['value']}\n"

    # use _i_ as that is less likely to have a conflict with user code

    # TODO: put outputs behind if

    # TODO: calculate costs for each.
    # Perhaps this can just be like:
    # cost = 0
    # # PV
    # cost += PV_size_kw * states_pv_size

    # cost = 0
    # for model in scenarios:
    #     if hasattr(model, 'cost'):
    #         cost += model.cost(params, states)
    # return cost

    for k, v in all_states.items():
        if no_outputs:
            out += f"    {k} = {v}\n"
        else:
            out += f"    {k}_out = np.zeros(num_steps + 1)\n"
            out += f"    {k}_out[0] = initial_{k}\n"
            out += f"    {k} = initial_{k}\n"

    if should_output_deltas:
        for k in output_deltas_to_save:
            out += f"    {k} = np.zeros(num_steps + 1)\n"

    out += all_costs

    out += "\n    state_terminate_sim = 0\n"
    out += "    for _i_ in range(num_steps):\n\n"
    out += "        if state_terminate_sim == 1:\n"
    out += "            continue\n"
    out += function_lists

    if no_outputs:
        out += "\n    if state_terminate_sim == 0:"
        out += "\n        return 999999"  # TODO: no const
        out += "\n    return all_costs\n"
    else:

        # TODO: Support datetime outputs
        # state_datetime_out = np.array(['2020-01-01'] * num_steps, dtype='datetime64')

        out += '        ###### Store outputs ######\n'
        for k in all_state_keys:
            out += f"        {k}_out[_i_ + 1] = {k}\n"

        if should_output_deltas:
            # for k in output_deltas_to_save:
            #     new_output_keys.append(k + "_deltas")

            #     np.vstack((x,y))
            delta_key_strs = ",".join(output_deltas_to_save)
            out += f'    delta_key_strs = "{delta_key_strs}"\n'
            # out += '    delta_values = np.array([])\n'
            # for key in output_deltas_to_save:
            #     out += f'    delta_values = np.vstack((delta_values,{key}))\n'
            # out += '    delta_values = "hi"\n'
            # out += f'    for key in delta_key_strs.split(","):\n'
            # out += '        print(key)\n'
            all_state_strs = ", ".join(
                all_output_keys + ["delta_key_strs"] + output_deltas_to_save)
        else:
            all_state_strs = ", ".join(all_output_keys)

        out += f"\n    return all_costs, {all_state_strs}\n"

    abs_dir = pathlib.Path(__file__).parent
    gen_path = os.path.join(abs_dir, f'{get_gen_name(should_output_deltas, use_numba)}.py')
    with open(gen_path, 'w') as f:
        f.write(out)

    return all_args


def get_gen_name(should_output_deltas, use_numba):
    should_output_deltas_str = ''
    if should_output_deltas:
        should_output_deltas_str = 'd'
    use_numba_str = ''
    if use_numba:
        use_numba_str = 'n'
    return f'generated{use_numba_str}{should_output_deltas_str}'