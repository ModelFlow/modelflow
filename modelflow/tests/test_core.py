from modelflow.modelflow import run_scenario


class PrivateExampleModel:   
    states = [
        dict(
            key="private_example",
            label="Private Example",
            value=0,
            private=True
        )
    ]

    @staticmethod
    def run_step(states, params, utils):
        states.private_example += 1



class TestPrivate():
    scenario = {
        "simulation_params": {
            "max_num_steps": 3,
        },
        "model_instances": {
            "private_ex": {
                "model_class": PrivateExampleModel,
                "label": "Private Example Instance",
            }
        }
    }

    def test_statuses(self):
        outputs = run_scenario(self.scenario)
        assert len(outputs['states']['private_ex']['private_example']) == 3
        assert outputs['states']['private_ex']['private_example'][0] == 1
        assert outputs['states']['private_ex']['private_example'][1] == 2
        assert outputs['states']['private_ex']['private_example'][2] == 3


class SharedStateExampleModel:   
    states = [
        dict(
            key="shared_example",
            label="Shared Example",
            value=0
        )
    ]

    @staticmethod
    def run_step(states, params, utils):
        states.shared_example += 1



class TestSharedState():
    scenario = {
        "simulation_params": {
            "max_num_steps": 3,
        },
        "model_instances": {
            "shared_ex": {
                "model_class": SharedStateExampleModel,
                "label": "Shared Example Instance",
            }
        }
    }

    def test_statuses(self):
        outputs = run_scenario(self.scenario)
        assert len(outputs['states']['shared_ex']['shared_example']) == 3
        assert outputs['states']['shared_ex']['shared_example'][0] == 1
        assert outputs['states']['shared_ex']['shared_example'][1] == 2
        assert outputs['states']['shared_ex']['shared_example'][2] == 3


# import sys
# import os
# import json
# import pathlib


# sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.absolute()))
# from examples.simple.models import list_models
# from modelflow.modelflow import get_params, run_sim


# class TestCore:

#     # TODO: FIX
#     # def test_sim(self):
#     #     models = list_models()
#     #     scenario = load_scenario()
#     #     scenario['params'] = self.test_get_params()
#     #     scenario['params'][0]['value'] = 10000  # testing parameter overrides
#     #     abs_path = pathlib.Path(__file__).parent.parent.parent.absolute()
#     #     sim_dir = os.path.join(abs_path, 'examples', 'simple')
#     #     outputs = run_sim(scenario, models, sim_dir)
#     #     for key in outputs['output_states']:
#     #         print(key, outputs['output_states'][key]['data'][:5])

#     def test_get_params(self):
#         # NOTE: This will change
#         models = list_models()
#         scenario = load_scenario()
#         params = get_params(scenario, models)
#         return params

# def load_scenario():
#     abs_path = pathlib.Path(__file__).parent.parent.parent.absolute()
#     abs_path = os.path.join(abs_path, 'examples', 'simple', 'scenarios', 'basic.json')
#     scenario = None
#     with open(abs_path, 'r') as f:
#         scenario = json.load(f)
#     return scenario