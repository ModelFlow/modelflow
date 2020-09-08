import sys
import os
import json
import pathlib


sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.absolute()))
from examples.simple.models import list_models
from modelflow.modelflow import get_params, run_sim


class TestCore:

    def test_sim(self):
        models = list_models()
        scenario = load_scenario()
        scenario['params'] = self.test_get_params()
        scenario['params'][0]['value'] = 10000  # testing parameter overrides
        abs_path = pathlib.Path(__file__).parent.parent.parent.absolute()
        sim_dir = os.path.join(abs_path, 'examples', 'simple')
        outputs = run_sim(scenario, models, sim_dir)
        for key in outputs['output_states']:
            print(key, outputs['output_states'][key]['data'][:5])

    def test_get_params(self):
        # NOTE: This will change
        models = list_models()
        scenario = load_scenario()
        params = get_params(scenario, models)
        return params

def load_scenario():
    abs_path = pathlib.Path(__file__).parent.parent.parent.absolute()
    abs_path = os.path.join(abs_path, 'examples', 'simple', 'scenarios', 'basic.json')
    scenario = None
    with open(abs_path, 'r') as f:
        scenario = json.load(f)
    return scenario