import re
import inspect
import time
import pandas as pd
import numpy as np
from consumer import Consumer
from producer import Producer
from types import SimpleNamespace
from numba import jit


def python_modelflow(config):

    c = Consumer().definition
    print(c['params'])

    num_steps = config['run_for_steps']
    t0 = time.time()
    all_outputs = []

    params_dict = {}
    state_dict = {}
    for model_info in config['models']:
        model = model_info['model']
        for param in model.definition['params']:
            if not model.__class__.__name__ in params_dict:
                params_dict[model.__class__.__name__] = {}
            params_dict[model.__class__.__name__][param['key']] = param['value']

        params_dict[model.__class__.__name__] = SimpleNamespace(**params_dict[model.__class__.__name__])
        for state in model.definition['states']:
            state_dict[state['key']] = state['value']

    all_state = SimpleNamespace(**state_dict)
    print(all_state)

    for i in range(num_steps):
        toutputs = dict(i=i)
        for model_info in config['models']:
            model = model_info['model']

            # if model not in models_to_run:
            #     continue
            # print(all_state)
            # NOTE: This hack only works with states being different names
            # model.run_step(all_state, all_state, model._params, all_state)
            # print(all_state)
            # TODO: change to getattr or .__class__ ?
            Producer.run_step(all_state, all_state, params_dict[Producer.__name__], all_state, None)
            Consumer.run_step(all_state, all_state, params_dict[Consumer.__name__], all_state, None)

        for key, value in all_state.__dict__.items():
            toutputs[key] = value
        all_outputs.append(toutputs)
    dur = time.time() - t0
    # t1 = time.time()
    df = pd.DataFrame(all_outputs)
    output_path = 'test.csv'
    df.to_csv(output_path)
    # saved = time.time() - t1
    # print(f"Model ran in {dur} seconds. Saved in {saved} seconds. Saved {output_path}")
    print(f"Model ran in {dur} seconds.")

# @jit(nopython=True, cache=True)
# def numba_test(num_steps):
#     params_max_widgets_per_hour_created = 15
#     params_cost_per_widget = 5
#     params_max_widgets_per_hour_consumed = 10
#     params_paid_per_widget = 10

#     indexes = np.zeros(num_steps)
#     states_pmoney = np.zeros(num_steps)
#     states_widgets = np.zeros(num_steps)
#     states_cmoney = np.zeros(num_steps)

#     states_pmoney[0] = 1000000
#     states_cmoney[0] = 1000000

#     for i in range(num_steps):
#         indexes[i] = i

#         if states_pmoney[i] > 0:
#             widgets_per_hr = min(params_max_widgets_per_hour_created, states_pmoney[i] // params_cost_per_widget)
#             states_pmoney[i] -= params_cost_per_widget * widgets_per_hr
#             states_widgets[i] += params_max_widgets_per_hour_created

#         if states_cmoney[i] > 0:
#             consumed = min(params_max_widgets_per_hour_consumed, states_cmoney[i] // params_paid_per_widget)
#             states_widgets[i] -= consumed
#             states_pmoney[i] += params_paid_per_widget * consumed
#             states_cmoney[i] -= params_paid_per_widget * consumed

#     return indexes, states_pmoney, states_cmoney, states_widgets

def generated_numba(config):

    out = "# Generated Code\n"
    # TODO: Handle imports better
    out += "import numpy as np\n"
    out += "import math\n"
    out += "from numba import jit\n"
    out += "\n"
    out += "\n"
    out += "@jit(nopython=False, cache=True)\n"

    params_dict = {}
    state_dict = {}
    for model_info in config['models']:
        model = model_info['model']
        for param in model.definition['params']:
            if not model.__class__.__name__ in params_dict:
                params_dict[model.__class__.__name__] = {}
            params_dict[model.__class__.__name__][param['key']] = param['value']

        for state in model.definition['states']:
            state_dict[state['key']] = state['value']
    all_states = {}
    all_params = {}
    all_flines = []
    for model_info in config['models']:
        model = model_info['model']
        model_name = model.__class__.__name__
        flines = inspect.getsource(model.run_step)
        # Exclude first two lines
        flines = '\n'.join(flines.split('\n')[2:])
        flines = f'        # {model_name} ######\n' + flines
        # match all inputs. , outputs. , states.
        states_strs = re.findall(r'states.\w*', flines)
        states_strs += re.findall(r'inputs.\w*', flines)
        states_strs += re.findall(r'outputs.\w*', flines)

        for state_str in states_strs:
            state_name = state_str.split('.')[1]
            if not state_name in state_dict:
                print(f"Could not find {state_name}")
                continue
            new_name = "state_" + state_name
            flines = flines.replace(state_str, new_name)
            all_states[new_name] = state_dict[state_name]

        # match all params.
        param_strs = re.findall(r'params.\w*', flines)
        for param_str in param_strs:
            param_name = param_str.split('.')[1]
            if param_name not in params_dict[model_name]:
                raise Exception(f"Found param not in dict {param_name}")

            new_name = param_str.replace(".","_")
            new_name = model_name + "_" + new_name
            all_params[new_name] = params_dict[model_name][param_name]
            flines = flines.replace(param_str, new_name)
        flines += '\n'

        # TODO support data
        all_flines.append(flines)


    # all_kwargs = []
    # for k, v in all_dicts.items():
    #     all_kwargs.append("{key}={value}")
    all_args = []
    all_arg_vals = []
    for k in sorted(list(all_params.keys())):
        all_args.append(k)
        all_arg_vals.append(all_params[k])

    all_output_keys = []
    only_states = []
    all_state_keys = sorted(list(all_states.keys()))
    for k in all_state_keys:
        only_states.append(k.replace('',''))
        all_output_keys.append(k+"_out")
        all_args.append(f"initial_{k}")
        all_arg_vals.append(all_states[k])

    all_args_str = ",".join(all_args)

    out += f"def rstep(num_steps,{all_args_str}):\n"
    # use _i_ as that is less likely to have a conflict with user code
    for k, v in all_states.items():
        out += f"    {k}_out = np.zeros(num_steps + 1)\n"
        out += f"    {k}_out[0] = initial_{k}\n"
        out += f"    {k} = initial_{k}\n"

    out += "\n    for _i_ in range(num_steps):\n\n"
    for flines in all_flines:
        out += flines

    out += '        ###### Store outputs ######\n'
    for k in all_state_keys:
        out += f"        {k}_out[_i_ + 1] = {k}\n"

    all_state_strs = ", ".join(all_output_keys)
    out += f"\n    return {all_state_strs}\n"

    with open('generated.py', 'w') as f:
        f.write(out)

    rstep = __import__('generated').rstep
    t0 = time.time()
    outputs = rstep(config['run_for_steps'], *all_arg_vals)
    print(time.time() - t0)

    t0 = time.time()
    outputs = rstep(config['run_for_steps'], *all_arg_vals)
    print(time.time() - t0)

    print(all_state_keys)
    print(outputs)
    df = pd.DataFrame(dict(zip(all_state_keys, outputs)))
    df.to_csv('test.csv')
 


def partial_numba(config):

    c = Consumer().definition
    print(c['params'])

    num_steps = config['run_for_steps']
    t0 = time.time()
    all_outputs = []

    params_dict = {}
    state_dict = {}
    for model_info in config['models']:
        model = model_info['model']
        for param in model.definition['params']:
            if not model.__class__.__name__ in params_dict:
                params_dict[model.__class__.__name__] = {}
            params_dict[model.__class__.__name__][param['key']] = param['value']

        params_dict[model.__class__.__name__] = SimpleNamespace(**params_dict[model.__class__.__name__])
        for state in model.definition['states']:
            state_dict[state['key']] = state['value']

    all_state = SimpleNamespace(**state_dict)
    print(all_state)

    for i in range(num_steps):
        toutputs = dict(i=i)
        for model_info in config['models']:
            model = model_info['model']

            # if model not in models_to_run:
            #     continue
            # print(all_state)
            # NOTE: This hack only works with states being different names
            # model.run_step(all_state, all_state, model._params, all_state)
            # print(all_state)
            # TODO: change to getattr or .__class__ ?
            model.__class__.run_step(all_state, all_state, params_dict[model.__class__.__name__], all_state, None)
            # Consumer.run_step(all_state, all_state, params_dict[Consumer.__name__], all_state, None)

        for key, value in all_state.__dict__.items():
            toutputs[key] = value
        all_outputs.append(toutputs)
    dur = time.time() - t0
    # t1 = time.time()
    # df = pd.DataFrame(all_outputs)
    # output_path = 'test.csv'
    # df.to_csv(output_path,index=False)
    # saved = time.time() - t1
    # print(f"Model ran in {dur} seconds. Saved in {saved} seconds. Saved {output_path}")
    print(f"Model ran in {dur} seconds.")


def main():
    config = {
        "models": [
            {
                "model": Producer()
            },
            {
                "model": Consumer()
            },
        ],
        "run_for_steps": 3000000
    }
    # python_modelflow(config)
    # t0 = time.time()
    # numba_test(config["run_for_steps"])
    # dur = time.time() - t0
    # print(f"Model ran in {dur} seconds.")

    generated_numba(config)


if __name__ == '__main__':
    main()
