import copy
import pytest
from models.time import Time
from models.starship import Starship
from models.mars_surface import MarsSurface
from models.mass_simulator import MassSimulator
from models.interplanetary_space import InterplanetarySpace

from modelflow.modelflow import run_scenario

base_scenario = {
    "simulation_params": {
        "max_num_steps": 1000,
    },
    "model_instances": {
        "time": {
            "model_class": Time,
            "label": "Simulation Space & Time",
            "parent_instance_key": None,
            "overrides": {  # Overrides either params or initial states
                "utc_start": 0,
                "current_utc": 0,
                "seconds_per_sim_step": 3600
            }
        },
        "starship": {
            "model_class": Starship,
            "label": "Starship",
            "parent_instance_key": "interplanetary_space",
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
            "parent_instance_key": "time",
        },
        "mars_surface": {
            "model_class": MarsSurface,
            "label": "Mars Surface",
            "parent_instance_key": "time",
        },
        "mass_simulator": {
            "model_class": MassSimulator,
            "label": "Mass Simulator",
            "parent_instance_key": "starship",
            "overrides": {
                "mass": 1,
                "volume": 1
            }
        },

    }
}


class TestStarship():

    def test_statuses(self):
        outputs = run_scenario(base_scenario)
        print(outputs)
        status_arr = outputs['private_states']['starship']['status']
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
        bad_scenario = copy.deepcopy(base_scenario)
        bad_scenario['model_instances'].pop("mars_surface", None)
        outputs = run_scenario(bad_scenario)
        assert outputs['error'] == "Cannot move 'starship' since destination key 'mars_surface' does not exist"

    def test_valid_schema_change(self):
        outputs = run_scenario(base_scenario)
        assert outputs['trees'][0] == {'time': {'children': [{'interplanetary_space': {'children': [{'starship': {'children': ['mass_simulator']}}]}}, 'mars_surface']}}
        assert outputs['trees'][47] == {'time': {'children': ['interplanetary_space', {'mars_surface': {'children': [{'starship': {'children': ['mass_simulator']}}]}}]}}

    def test_pre_launch_checks(self):
        bad_scenario = copy.deepcopy(base_scenario)
        bad_scenario['model_instances']["mass_simulator"]["overrides"]["mass"] = 100000000000
        outputs = run_scenario(bad_scenario)
        assert outputs['error'] == "Exceeded payload initial mass capacity"
