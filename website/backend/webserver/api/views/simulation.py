import json
import os
import sys
import pathlib
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

root_dir = str(pathlib.Path(__file__).absolute().parents[5])
sys.path.insert(0, os.path.join(root_dir, 'modelflow'))

from modelflow import run_scenario # NOQA

@csrf_exempt
@require_POST

def run_sim(request):
    body = json.loads(request.body)

    if not 'scenario' in body:
        return JsonResponse(dict(error="No key named scenario in body"))

    output_keys = body.get("output_keys", [])

    project_name = body['scenario']['project_meta']['name']
    model_library_path = os.path.join(root_dir, 'projects', project_name, 'model_classes')
    outputs = run_scenario(body['scenario'], model_library_path)

    # DEBUG
    # should_generate_graph = int(body.get("should_generate_graph", 0)) == 1
    # if should_generate_graph:
    # TODO: Ensure react flow chart works
    # outputs['flow'] = generate_react_flow_chart(outputs)

    # Only send back the data that is requested by the frontend
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
                    flat_dict[final_key] = dict(data=arr, label=final_key)

    for key, value in outputs['delta_outputs'].items():
        outputs["all_output_states_keys"].append(key)
        if key in output_keys:
            flat_dict[key] = dict(data=value, label=key)

    outputs["output_states"] = flat_dict
    outputs.pop('states', None)
    outputs.pop('delta_outputs', None)

    # 🌲📈 NOTE: Get arrays for Plotly TreeView here
    treeview_data = outputs['treeview_data']

    outputs["tree_changes"] = []
    prev_tree = None
    for i, tree in enumerate(outputs['trees']):
        if tree != prev_tree:
            outputs["tree_changes"].append(dict(index=i, tree=tree, treeViewData=treeview_data))
            print('(o_o) NEW TREE ADDED: ' + str(tree))
            print('(o_o) NEW TREEVIEW DATA ADDED: ' + str(treeview_data))
        prev_tree = tree
    outputs.pop('trees')

    # TODO: Handle better
    output_vals = list(outputs["output_states"].values())
    outputs['time'] = []
    if len(output_vals) > 0:
        an_output = output_vals[0]['data']
        outputs['time'] = list(range(len(an_output)))
    return JsonResponse(outputs)
