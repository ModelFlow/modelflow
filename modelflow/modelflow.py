from types import SimpleNamespace 

DEFAULT_MAX_STEPS = 1000

def run_scenario(scenario):

    max_steps = DEFAULT_MAX_STEPS
    if "simulation_params" in scenario:
        if  "max_num_steps" in scenario["simulation_params"]:
            max_steps = scenario["simulation_params"]["max_num_steps"]

    for key, value in scenario['model_instances'].items():
        value['key'] = key
        # TODO: Handle parameter and state overrides
    instance_descriptions = scenario['model_instances'].values()

    # TODO
    io = SimpleNamespace(all_of_the_states)

    for i in range(max_steps):
        for instance_description in instance_descriptions:
            instance_description[]
            run_step(io, params, states, data, utils)
    print("TODO")