from modelflow.modelflow import run_scenario


class PrivateExampleModel:   
    states = [
        dict(
            key="private_example",
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
                "model_class": PrivateExampleModel
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
                "model_class": SharedStateExampleModel
            }
        }
    }

    def test_simple_shared_state(self):
        outputs = run_scenario(self.scenario)
        assert len(outputs['states']['shared_ex']['shared_example']) == 3
        assert outputs['states']['shared_ex']['shared_example'][0] == 1
        assert outputs['states']['shared_ex']['shared_example'][1] == 2
        assert outputs['states']['shared_ex']['shared_example'][2] == 3

class Root:   
    pass

class AGroup:   
    pass

class AConsumer:   
    @staticmethod
    def run_step(states, params, utils):
        states.shared_state -= 1

class AProducer:
    params = [
        dict(
            key="production_per_step",
            value=5
        )
    ]

    states = [
        dict(
            key="shared_state",
            value=10
        )
    ]

    @staticmethod
    def run_step(states, params, utils):
        states.shared_state += params.production_per_step


class TestFindingOutsideSharedState():
    scenario = {
        "simulation_params": {
            "max_num_steps": 3,
        },
        "model_instances": {
            "fakeroot": {
                "model_class": Root,
            },
            "level1_group": {
                "model_class": AGroup,
                "initial_parent_key": "fakeroot",
            },
            "level1_partA": {
                "model_class": AProducer,
                "initial_parent_key": "fakeroot",
            },
            "level2_partA": {
                "model_class": AConsumer,
                "initial_parent_key": "level1_group",
            }
        }
    }

    # NOTE: There should be proper user defined prioritization setting

    def test_location_based_shared_state(self):

        outputs = run_scenario(self.scenario)
        print(outputs['states']['level1_partA']['shared_state'])
        assert len(outputs['states']['level1_partA']['shared_state']) == 3
        assert outputs['states']['level1_partA']['shared_state'][0] == 15
        assert outputs['states']['level1_partA']['shared_state'][1] == 19
        assert outputs['states']['level1_partA']['shared_state'][2] == 23


class TestSimpleSameNamedSharedState():
    scenario = {
        "simulation_params": {
            "max_num_steps": 2
        },
        "model_instances": {
            "fakeroot": {
                "model_class": Root
            },
            "group1": {
                "model_class": AGroup,
                "initial_parent_key": "fakeroot"
            },
            "group1_producer": {
                "model_class": AProducer,
                "initial_parent_key": "group1"
            },
            "group2": {
                "model_class": AGroup,
                "initial_parent_key": "fakeroot"
            },
            "group2_producer": {
                "model_class": AProducer,
                "initial_parent_key": "group2",
                "overrides": {
                    "shared_state": 100
                }
            }
        }
    }

    def test_simple_same_named_shared_state(self):
        outputs = run_scenario(self.scenario)
        print(outputs['states']['group1_producer']['shared_state'])
        print(outputs['states']['group2_producer']['shared_state'])

        assert len(outputs['states']['group1_producer']['shared_state']) == 2
        assert outputs['states']['group1_producer']['shared_state'][0] == 15
        assert outputs['states']['group1_producer']['shared_state'][1] == 20

        assert len(outputs['states']['group2_producer']['shared_state']) == 2
        assert outputs['states']['group2_producer']['shared_state'][0] == 105
        assert outputs['states']['group2_producer']['shared_state'][1] == 110

class TestSameNamedSharedState():
    scenario = {
        "simulation_params": {
            "max_num_steps": 2
        },
        "model_instances": {
            "fakeroot": {
                "model_class": Root
            },
            "group1": {
                "model_class": AGroup,
                "initial_parent_key": "fakeroot"
            },
            "group1_producer": {
                "model_class": AProducer,
                "initial_parent_key": "group1"
            },
            "group1_consumer": {
                "model_class": AConsumer,
                "initial_parent_key": "group1"
            },
            "group2": {
                "model_class": AGroup,
                "initial_parent_key": "fakeroot"
            },
            "group2_producer": {
                "model_class": AProducer,
                "initial_parent_key": "group2",
                "overrides": {
                    "shared_state": 100
                }
            },
            "group2_consumer": {
                "model_class": AConsumer,
                "initial_parent_key": "group2"
            }
        }
    }

    def test_same_named_shared_state(self):
        outputs = run_scenario(self.scenario)

        assert len(outputs['states']['group1_producer']['shared_state']) == 2
        assert outputs['states']['group1_producer']['shared_state'][0] == 15
        assert outputs['states']['group1_producer']['shared_state'][1] == 19

        assert len(outputs['states']['group2_producer']['shared_state']) == 2
        assert outputs['states']['group2_producer']['shared_state'][0] == 105
        assert outputs['states']['group2_producer']['shared_state'][1] == 109




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