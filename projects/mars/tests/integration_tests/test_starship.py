import pytest
from model_classes.Time import Time
from model_classes.Starship import Starship
from model_classes.MarsSurface import MarsSurface
from model_classes.MassSimulator import MassSimulator
from model_classes.InterplanetarySpace import InterplanetarySpace
from modelflow.modelflow import run_scenario


class TestStarship():

    def setup(self):
        self.scenario = {
            "simulation_params": {
                "max_num_steps": 1000,
            },
            "model_instances": {
                "time": {
                    "model_class": Time,
                    "label": "Simulation Space & Time",
                    "initial_parent_key": None,
                    "overrides": {  # Overrides either params or initial states
                        "utc_start": 0,
                        "current_utc": 0,
                        "seconds_per_sim_step": 3600
                    }
                },
                "starship": {
                    "model_class": Starship,
                    "label": "Starship",
                    "initial_parent_key": "interplanetary_space",
                    "overrides": {
                        "launch_utc": 3600 * 24,
                        "travel_days_to_mars": 1,
                        "travel_days_from_mars": 1,
                        "mars_stay_days": 1
                    }
                },
                "interplanetary_space": {
                    "model_class": InterplanetarySpace,
                    "label": "Interplanetary Space",
                    "initial_parent_key": "time",
                },
                "mars_surface": {
                    "model_class": MarsSurface,
                    "label": "Mars Surface",
                    "initial_parent_key": "time",
                },
                "mass_simulator": {
                    "model_class": MassSimulator,
                    "label": "Mass Simulator",
                    "initial_parent_key": "starship",
                    "overrides": {
                        "mass": 1,
                        "volume": 1
                    }
                }
            }
        }

    def test_statuses(self):
        outputs = run_scenario(self.scenario)
        # print(outputs)
        status_arr = outputs['states']['starship']['status']
        # print(status_arr)
        assert status_arr[0] == 'Pre-launch'
        assert status_arr[23] == 'Launching from LEO'
        assert status_arr[24] == 'Traveling to Mars'
        assert status_arr[47] == 'Mars Landing'
        assert status_arr[48] == 'On Mars Surface'
        assert status_arr[71] == 'Launching from Mars'
        assert status_arr[72] == 'Traveling to Earth'
        assert status_arr[95] == 'Landing on Earth'
        assert status_arr[96] == 'Landed on Earth'

    def test_invalid_schema_change(self):
        self.scenario['model_instances'].pop("mars_surface", None)
        output = run_scenario(self.scenario)
        assert "Cannot move 'starship' since destination key 'mars_surface' does not exist" in output['error']

    def test_valid_schema_change(self):
        output = run_scenario(self.scenario)
        assert output['trees'][0] == {'root': {'children': [{'time': {'children': [{'interplanetary_space': {'children': [{'starship': {'children': ['mass_simulator']}}]}}, 'mars_surface']}}]}}
        assert output['trees'][47] == {'root': {'children': [{'time': {'children': ['interplanetary_space', {'mars_surface': {'children': [{'starship': {'children': ['mass_simulator']}}]}}]}}]}}

    def test_pre_launch_checks(self):
        self.scenario['model_instances']["mass_simulator"]["overrides"]["mass"] = 100000000000
        output = run_scenario(self.scenario)
        assert "Exceeded payload initial mass capacity" in output['error']
