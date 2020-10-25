import time
from . import blackbox as bb
from .modelflow import generate_numba_compatible_code

class Sweep():

    def __init__(self, scenario, data):
        self.scenario = scenario
        self.data = data

    def run_sweep(self, params):
        rstep = __import__('generated').rstep
        # TODO: Figure out a way to pass this through
        num_steps = self.scenario['run_for_steps']
        max_cost = 9999999
        cost = max_cost
        t0 = time.time()
        try:
            cost = rstep(num_steps, *params, self.data)
            print(f"Ran in {time.time() - t0} {cost}")
        except Exception as e:
            print(f"SIM ERROR {e} in {time.time() - t0}")
        return cost



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
        model = model_info['model']
        if 'params' in model.definition:
            for param in model.definition['params']:
                params_dict[model.__class__.__name__ +
                            '_params_' + param['key']] = param

        if hasattr(model, 'load_data'):
            data = model.__class__.load_data()

    # TODO: Support multiple data
    # for k, v in data_dict.items():
    #     all_args.append(f'{k}_data')
    #     if not is_sweep:
    #         all_arg_vals.append(v)

    args = generate_numba_compatible_code(
        scenario['models'],
        scenario['run_for_steps'],
        no_outputs=True,
        is_sweep=True,
        use_numba=True
    )
    parameter_ranges = []
    # TODO: Handle data arguments better
    for arg in args[:-1]:
        param = params_dict[arg]
        parameter_ranges.append([param['min'], param['max']])

    s = Sweep(scenario, data)
    best_params = bb.search_min(f=s.run_sweep,  # given function
                                domain=parameter_ranges,
                                budget=1000,  # total number of function calls available
                                batch=4,  # number of calls that will be evaluated in parallel
                                resfile='bb2.csv')

    # TODO: Add cost
    print("Optimal Parameters are:")
    for i in range(len(best_params)):
        print(f"{args[:-1][i]}: {best_params[i]}")

