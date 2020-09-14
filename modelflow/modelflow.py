import sys
import os
import pathlib
import copy
import json
import numpy as np
import re
import inspect
import time
from types import SimpleNamespace
import pandas as pd
from datetime import timedelta, datetime
from . import blackbox as bb
from math import log10, floor

def obj(**kwargs):
    return SimpleNamespace(**kwargs)


# class Model():
#     def __init__(self):
#         self.setup()

#         if hasattr(self, 'params'):
#             _params = {}
#             for param in self.params:
#                 if not isinstance(param, ModelParam):
#                     raise Exception("Invalid model param")
#                 _params[param.key] = param.value
#                 if param.value is None:
#                     raise Exception(f"Model {self.name} param {param.key} cannot be None")
#             self._params = SimpleNamespace(**_params)
#         else:
#             self._params = None

#         if hasattr(self, 'states'):
#             for state in self.states:
#                 setattr(self, state.key, state.value)

#     def setup():
#         raise NotImplementedError("Must Override")


# class ModelParam():
#     def __init__(self,
#                  key=None,
#                  label=None,
#                  description=None,
#                  units=None,
#                  minimum=0,
#                  maximum=0,
#                  value=None,
#                  notes=0,
#                  required=True,
#                  source="",
#                  default_value=None):
#         self.key = key
#         self.label = label
#         self.description = description
#         self.units = units
#         self.minimum = minimum
#         self.maximum = maximum
#         self.value = value
#         self.notes = notes
#         self.source = source
#         self.required = required
#         self.default_value = None


# class ModelState():
#     def __init__(self,
#                  key=None,
#                  label=None,
#                  description=None,
#                  units=None,
#                  value=0,
#                  notes=0,
#                  default_value=None):
#         self.key = key
#         self.label = label
#         self.description = description
#         self.units = units
#         self.value = value
#         self.notes = notes
#         self.default_value = None

class Sweep():
    
    def __init__(self, scenario, data):
        self.scenario = scenario
        self.data = data

    def run_sweep(self, params):
        rstep = __import__('generated').rstep
        num_steps = self.scenario['run_for_steps'] # TODO: Figure out a way to pass this through
        max_cost = 9999999
        cost = max_cost
        t0 = time.time()
        try:
            cost = rstep(num_steps, *params, self.data)
            print(f"Ran in {time.time() - t0} {cost}")
        except Exception as e:
            print(f"SIM ERROR {e} in {time.time() - t0}")
        return cost

def get_params(scenario, models):
    model_map = {}
    for model in models:
        model_map[model.__class__.__name__] = model

    for model in scenario['models']:
        if model['model'] not in model_map:
            raise Exception(f"{model['model']} not in model list!")
        model['model'] = model_map[model['model']]

    # params_dict = {}
    all_params = []
    data = None
    i = 0
    for model_info in scenario['models']:
        print(model_info)
        model = model_info['model']
        if 'params' in model.definition:
            for param in model.definition['params']:
                param['new_key'] = model.__class__.__name__+ '_params_' + param['key']
                param['agent'] = model.__class__.__name__
                param['index'] = i
                all_params.append(param)
                i += 1
                # params_dict[model.__class__.__name__+ '_params_' + param['key']] = param

        # if hasattr(model, 'load_data'):
        #     print(f"inside has data {model.__class__.__name__}")
        #     data = model.__class__.load_data()

    return all_params


def run_minimization(scenario, models):
    # if exception is raised then cost is 999999
    # incorporate timestamp to reward longer lasting simulations?
    # For is sweep:
    # - change inputs to just be a param array
    # - do not save outputs
    # - return a cost
    #   - super high cost if early fail

    model_map = {}
    for model in models:
        model_map[model.__class__.__name__] = model

    for model in scenario['models']:
        if model['model'] not in model_map:
            raise Exception(f"{model['model']} not in model list!")
        model['model'] = model_map[model['model']]

    params_dict = {}
    data = None
    for model_info in scenario['models']:
        print(model_info)
        model = model_info['model']
        if 'params' in model.definition:
            for param in model.definition['params']:
                params_dict[model.__class__.__name__+ '_params_' + param['key']] = param

        if hasattr(model, 'load_data'):
            print(f"inside has data {model.__class__.__name__}")
            data = model.__class__.load_data()

    # TODO: Support multiple data
    # for k, v in data_dict.items():
    #     all_args.append(f'{k}_data')
    #     if not is_sweep:
    #         all_arg_vals.append(v)

    args = generated_numba(
        scenario['models'],
        scenario['run_for_steps'],
        None, # TODO: states_override
        None, # TODO: params_override
        no_outputs=True,
        is_sweep=True
    )
    parameter_ranges = []
    # TODO: Handle data arguments better
    for arg in args[:-1]:
        param = params_dict[arg]
        parameter_ranges.append([param['min'], param['max']])

    # print(args[:-1])
    # Battery_params_ac_capacity_kw,Battery_params_dc_capacity_kwh,FoodStorage_params_max_food_edbl,PVInverter_params_max_kw_ac,SolarArray_params_scaling_factor

    s = Sweep(scenario, data)
    best_params = bb.search_min(f = s.run_sweep,  # given function
                            domain = parameter_ranges,
                            budget = 1000,  # total number of function calls available
                            batch = 4,  # number of calls that will be evaluated in parallel
                            resfile = 'bb2.csv')

    # TODO: Add cost
    print("Optimal Parameters are:")
    for i in range(len(best_params)):
        print(f"{args[:-1][i]}: {best_params[i]}")


def run_sim(scenario, models, sim_dir):
    tsall0 = time.time()
    model_map = {}
    for model in models:
        model_map[model.__class__.__name__] = model

    for model in scenario['models']:
        if model['model'] not in model_map:
            raise Exception(f"{model['model']} not in model list!")
        model['model'] = model_map[model['model']]

    params_dict = {}
    initial_states_dict = {}
    data_dict = {}
    for model_info in scenario['models']:
        model = model_info['model']
        if 'params' in model.definition:
            for param in model.definition['params']:
                params_dict[model.__class__.__name__+ '_params_' + param['key']] = param

        if hasattr(model, 'load_data'):
            print(f"inside has data {model.__class__.__name__}")
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

    # TODO: add option to run pure python or numba

    args = None
    should_gen = True

    abs_dir = pathlib.Path(__file__).parent

    arg_cachepath = os.path.join(abs_dir, 'args_cache.json')
    gen_path = os.path.join(abs_dir, 'generated.py')
    if os.path.exists(arg_cachepath) and os.path.exists(gen_path):
        file_list = []
        times = []
        for root, _, filenames in os.walk(sim_dir):
            for filename in filenames:
                file_list.append(os.path.join(root, filename))
        for filepath in file_list:
            if os.path.isfile(filepath):
                times.append(os.path.getmtime(filepath))
        # print(times)
        oldest_time = list(sorted(times))[0]
        if oldest_time < os.path.getmtime(arg_cachepath):
            should_gen = False

            with open(arg_cachepath, 'r') as f:
                args = json.load(f)

    if should_gen:
        print("Generating numba cache")
        args = generated_numba(
            scenario['models'],
            scenario['run_for_steps'],
            None, # TODO: states_override
            None, # TODO: params_override
            no_outputs=False,
            is_sweep=False
        )

        with open(arg_cachepath, 'w') as f:
            json.dump(args, f)

    params = []
    for arg in args:
        if arg in override_params_dict:
            params.append(override_params_dict[arg])
        elif arg in params_dict:
            params.append(params_dict[arg]['value'])
        elif arg in initial_states_dict:
            params.append(initial_states_dict[arg])
        elif arg in data_dict:
            params.append(data_dict[arg])
        else:
            raise Exception(f"Could not find {arg} in params or state dict")

    print(abs_dir)
    sys.path.insert(0, str(abs_dir))
    rstep = __import__('generated').rstep
    num_steps = scenario['run_for_steps']
    ts0 = time.time()
    cost_and_outputs = rstep(num_steps, *params)
    ts1 = time.time()

    all_state_keys = sorted(list(initial_states_dict.keys()))
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

    times = list(range(len(list(output_states.values())[0]['data'])))
    tsall1 = time.time()
    output = {
        "stats": {
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
    print(f"Model ran in {ts1 - ts0} total {tsall1 - tsall0} pre {ts0 - tsall0} post {tsall1 - ts1}")
    return output


    # try:
        
    #     print(f"Ran in {time.time() - t0} {cost}")
    # except Exception as e:
    #     print(f"SIM ERROR {e} in {time.time() - t0}")

    # if scenario is None and models is None:
    #     raise Exception("Scenario or scenario and models are required")

    # if models is not None:
    #     model_map = {}
    #     for model in models:
    #         model_map[model.__class__.__name__] = model

    #     for model in scenario['models']:
    #         if model['model'] not in model_map:
    #             raise Exception(f"{model['model']} not in model list!")
    #         model['model'] = model_map[model['model']]

    # df1 = generated_numba(scenario['models'], scenario['run_for_steps'], None, None)
    # print(df1.columns)
    # start_date = datetime(2024,1,1)
    # final_col = []
    # for i in range(len(df1['datetime'])):
    #     final_col.append(start_date + timedelta(hours=i))
    # df1['datetime'] = final_col
    # df1.to_csv('nb_test.csv')


    # # TODO: This is inelegant
    # df = run_simulation_inner(scenario['models'], scenario['run_for_steps'],
    #                             scenario.get('states', {}), scenario.get('params', {}))
    # start_date = datetime(2024,1,1)
    # final_col = []
    # for i in range(len(df['datetime'])):
    #     final_col.append(start_date + timedelta(hours=i))
    # df['datetime'] = final_col
    # df.to_csv('py_test.csv')


def run_test_step(model, inputs, outputs):

    # for state in model.states:
    #     setattr(model, state.key, state.value)

    # if hasattr(model, 'params'):
    #     _params = {}
    #     for param in model.params:
    #         _params[param.key] = param.value
    #         if param.value is None:
    #             raise Exception(f"Model {model.name} param {param.key} cannot be None")
    #     model._params = SimpleNamespace(**_params)
    # else:
    #     model._params = None

    model.run_step(inputs, outputs, model._params, model)


def setup_models(model_infos):
    all_state = {}
    for model_info in model_infos:
        model = model_info['model']
        if hasattr(model, 'states'):
            for state in model.states:
                all_state[state.key] = state.value
    return SimpleNamespace(**all_state)


def generated_numba(model_infos, num_steps, states_override, params_override, no_outputs=False, is_sweep=False):

    out = "# Generated Code\n"
    # TODO: Handle imports better
    out += "import numpy as np\n"
    out += "import math\n"
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
            print(f"inside has data {model.__class__.__name__}")
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

    # TODO: call setup for each agent

    all_states = {}
    function_lists = ''
    all_olines = ''
    all_costs = '\n    all_costs = 0\n'
    for model_info in model_infos:
        model = model_info['model']
        model_name = model.__class__.__name__
        flines = inspect.getsource(model.run_step)
        # Exclude first two lines
        flines = '\n'.join(flines.split('\n')[2:])
        olines = ''
        olines = "@jit(nopython=True, cache=True)\n"

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
                new_name = model_name + "_" + param_str.replace(".","_")
                clines = clines.replace(param_str, new_name)

            clines = clines.replace('    return ', 'all_costs += ')
            all_costs += f'    # {model_name} cost\n'
            all_costs += clines

        # match all inputs. , outputs. , states.
        states_strs = re.findall(r'states\.\w*', flines)
        states_strs += re.findall(r'inputs\.\w*', flines)
        states_strs += re.findall(r'outputs\.\w*', flines)
        new_states_set = set(["state_terminate_sim"])
        for state_str in states_strs:
            state_name = state_str.split('.')[1]
            new_name = "state_" + state_name
            new_states_set.add(new_name)
            flines = flines.replace(state_str, new_name)

            if not state_name in state_dict:
                print(f"Could not find state {state_name}")
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

            new_name = param_str.replace(".","_")
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

        function_lists += f'        {new_state_strs} = {model_name}({all_out_strs})\n'

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
    all_arg_vals = []
    exclude_sweep_params = []
    for k in sorted(list(all_params.keys())):
        if is_sweep:
            if 'min' in orig_params_dict[k] and 'max' in orig_params_dict[k]:
                all_args.append(k)
                exclude_sweep_params.append(k)
        else:
            all_args.append(k)
            all_arg_vals.append(all_params[k])

    all_output_keys = []
    only_states = []
    all_state_keys = sorted(list(all_states.keys()))
    for k in all_state_keys:
        only_states.append(k.replace('state_',''))
        if not no_outputs:
            all_output_keys.append(k+"_out")
        if not is_sweep:
            all_args.append(f"initial_{k}")
            all_arg_vals.append(all_states[k])

    for k, v in data_dict.items():
        all_args.append(f'{k}_data')
        all_arg_vals.append(v)

    all_args_str = ",".join(all_args)

    out += all_olines
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

        out += '        ###### Store outputs ######\n'
        for k in all_state_keys:
            out += f"        {k}_out[_i_ + 1] = {k}\n"

        all_state_strs = ", ".join(all_output_keys)
        out += f"\n    return all_costs, {all_state_strs}\n"

    abs_dir = pathlib.Path(__file__).parent
    with open(os.path.join(abs_dir, 'generated.py'), 'w') as f:
        f.write(out)

    return all_args

    # TODO: Support datetime eventually
    # state_datetime_out = np.array(['2020-01-01'] * num_steps, dtype='datetime64')
    # print(state_datetime_out)
    # print(state_datetime_out[0])
    # print(state_datetime_out.dtype)

    # rstep = __import__('generated').rstep

    # t0 = time.time()
    # outputs = rstep(num_steps, *all_arg_vals)
    # print(time.time() - t0)

    # t0 = time.time()
    # outputs = rstep(num_steps, *all_arg_vals)
    # print(time.time() - t0)
    # print(only_states)
    # df = pd.DataFrame(dict(zip(only_states, outputs)))
    # return df


def run_simulation_inner(model_infos, num_steps, states_override, params_override):

    # TODO improve speed
    all_outputs = []

    # Secretly have a dict called all states
    # where the inputs and outputs are just that
    # all_state = setup_models(model_infos)
    # for key, value in states_override.items():
    #     print(f"overriding state {key} with {value}")
    #     if not hasattr(all_state, key):
    #         raise Exception(f"Tried to override state {key} that doesn't exist")
    #     setattr(all_state, key, value)

    name_model_map = {}
    for model_info in model_infos:
        model = model_info['model']
        name_model_map[model.__class__.__name__] = model

    params_dict = {}
    state_dict = {}
    for model_info in model_infos:
        model = model_info['model']

        params_dict[model.__class__.__name__] = {}
        for param in model.definition['params']:
            params_dict[model.__class__.__name__][param['key']
                                                  ] = param['value']

        params_dict[model.__class__.__name__] = SimpleNamespace(
            **params_dict[model.__class__.__name__])
        if 'states' in model.definition:
            for state in model.definition['states']:
                state_dict[state['key']] = state['value']
    all_state = SimpleNamespace(**state_dict)

    # TODO: Fix param override
    # for raw_key, value in params_override.items():
    #     if not "." in raw_key:
    #         raise Exception("Need . in param_override like Human.food_eaten_per_hr")
    #     model_name, key = raw_key.split(".")
    #     if not model_name in name_model_map:
    #         raise Exception(f"Could not find model {model_name} for param_override {raw_key}")

    #     if not hasattr(name_model_map[model_name]._params,key):
    #         raise Exception(f"Could not find key {key} for param_override {raw_key}")

    #     setattr(name_model_map[model_name]._params,key, value)

    
    data_dict = {}
    for model_info in model_infos:
        model = model_info['model']
        data_dict[model.__class__.__name__] = None
        if hasattr(model, 'load_data'):
            print(f"inside has data {model.__class__.__name__}")
            data_dict[model.__class__.__name__] = model.__class__.load_data()

    t0 = time.time()
    for i in range(num_steps):
        toutputs = dict()
        for model_info in model_infos:
            model = model_info['model']
            if hasattr(model, 'run_step'):
                model.__class__.run_step(
                    all_state, all_state, params_dict[model.__class__.__name__], all_state, data_dict[model.__class__.__name__])

        for key, value in all_state.__dict__.items():
            toutputs[key] = value
        all_outputs.append(toutputs)
    print(time.time() - t0)
    return pd.DataFrame(all_outputs,columns=list(sorted(all_outputs[0].keys())))

def round_sig(x, sig=2): 
    if x == 0:
        return 0
    return round(x, sig-int(floor(log10(abs(x))))-1)