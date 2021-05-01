import os
import time
import sys
import json
import pathlib
from backend import app
from flask import request

root_dir = str(pathlib.Path(__file__).absolute().parents[4])
sys.path.insert(0, root_dir)


# TODO: DO NOT HARDCODE
HARD_CODED_SCENARIO_TO_USE = "baseline"
sys.path.insert(0, os.path.join(root_dir, "examples", "mars"))

from modelflow.modelflow import get_params, run_scenario  # NOQA

# from examples.mars.models import list_models
# from modelflow.graph_viz_from_outputs import generate_react_flow_chart

@app.route("/api/get_params")
def get_params_route():
    # TODO: Allow for loading different scenarios
    # DEBUG
    scenario_name = request.args.get("scenario", HARD_CODED_SCENARIO_TO_USE)
    scenario = get_scenario(scenario_name)

    return dict(params=get_params(scenario))


@app.route("/api/run_sim", methods=["POST"])
def run_sim_route():
    body = json.loads(request.data)

    # DEBUG
    scenario_name = body.get("scenario", HARD_CODED_SCENARIO_TO_USE)
    # should_generate_graph = int(body.get("should_generate_graph", 0)) == 1
    output_keys = body.get("output_keys", None)
    scenario = get_scenario(scenario_name)

    scenario["params"] = body["params"]

    outputs = run_scenario(scenario)

    # if should_generate_graph:

    # TODO: Ensure react flow chart works
    # outputs['flow'] = generate_react_flow_chart(outputs)

    # Only send back the data that is requested by the frontend
    # First, check which componets wanted in UI
    flat_dict = {}
    outputs["all_output_states_keys"] = []
    for instance_key, inner_dict in outputs['states'].items():
        for field_key, arr in inner_dict.items():
            final_key = f'{instance_key}___{field_key}'
            outputs["all_output_states_keys"].append(final_key)
        
            if output_keys is None:
                flat_dict[final_key] = arr
            else:
                if final_key in output_keys:
                    # HH: Create arr for component deltas
                    componentDeltas_dict = {}

                    # First, find quantity name in LABEL key (last word after underscore)
                    # Ex: o2, co2, h2o...
                    arr_final_key = final_key.rsplit('_', 3)
                    measured_substance = arr_final_key[1] + '_' + arr_final_key[2] + '_' + arr_final_key[3] + '_'
                    print("LABEL FOUND: " + measured_substance)

                    # Next, find component delta values, if any (name will have NAME_deltas at end)
                    # Ex: plants_o2_deltas, human1_co2_deltas...
                    # TODO: Need more accurate way to identify components of a variable... hard code it somewhere?
                    for delta_key, delta_value in outputs['delta_outputs'].items():
                        if measured_substance in delta_key:
                            print("DELTA FOUND: " + delta_key)
                            # Add delta key & data to componentDeltas_dict
                            componentDeltas_dict[delta_key] = dict(delta_label=delta_key, delta_data=delta_value)

                    # Store final data
                    flat_dict[final_key] = dict(data=arr, label=final_key, componentDeltas=componentDeltas_dict) # HH: I added components property here

    # Second, check which delta values wanted in UI
    for key, value in outputs['delta_outputs'].items():
        outputs["all_output_states_keys"].append(key)
        if key in output_keys:
            flat_dict[key] = dict(data=value, label=key) 

    outputs["output_states"] = flat_dict
    outputs.pop('states', None)
    outputs.pop('delta_outputs', None)

    outputs["tree_changes"] = []
    prev_tree = None
    for i, tree in enumerate(outputs['trees']):
        if tree != prev_tree:
            outputs["tree_changes"].append(dict(index=i, tree=tree))
        prev_tree = tree
    outputs.pop('trees')

    # TODO: Handle better
    an_output = list(outputs["output_states"].values())[0]['data']
    outputs['time'] = list(range(len(an_output)))

    # HH: For dev purposes, print output contents
    # List curr var in UI
    print("🧮 final output STATES: ") 
    print(outputs['output_states'])

    return outputs


def get_sim_dir():
    # TODO: Make generic
    abs_path = pathlib.Path(__file__).parents[4].absolute()
    abs_path = os.path.join(abs_path, "examples", "mars")
    return abs_path


def get_scenario(scenario_name):
    abs_path = get_sim_dir()
    abs_path = os.path.join(abs_path, "scenarios", f"{scenario_name}.json")
    scenario = None
    with open(abs_path, "r") as f:
        scenario = json.load(f)
    return scenario
