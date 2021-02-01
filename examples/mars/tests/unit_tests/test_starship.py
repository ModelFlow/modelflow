import pytest
from models.time import Time
from models.starship import Starship
from models.dummy_mass import DummyMass
from modelflow.modelflow import run_scenario

base_scenario = {
    "simulation_params": {
        "max_num_steps": 1000,
    },
    "model_instances": [
        {
            "unique_key": "time",
            "model_class": Time,
            "nickname": "Simulation Space & Time",
            "parent_instance_key": None,
            "param_overrides": {
                "utc_start": 0,
                "seconds_per_sim_step": 3600
            }
        },
        {
            "unique_key": "starship",
            "model_class": Starship,
            "nickname": "Starship",
            "parent_instance_key": "time",
            "param_overrides": {
                "launch_utc": 3600 * 24,
                "travel_days_to_mars": 1,
                "travel_days_from_mars": 1,
                "mars_stay_days": 1
            }
        },
    ]
}


class TestStarship():

    def test_statuses(self):
        outputs = run_scenario(base_scenario)
        assert outputs['status'][0] == 'Pre-launch'
        assert outputs['status'][24] == 'Launching from LEO'
        assert outputs['status'][25] == 'Traveling to Mars'
        assert outputs['status'][48] == 'Mars Landing'
        assert outputs['status'][49] == 'On Mars Surface'
        assert outputs['status'][72] == 'Launching from Mars'
        assert outputs['status'][73] == 'Traveling to Earth'
        assert outputs['status'][96] == 'Landing on Earth'
        assert outputs['status'][97] == 'Landed on Earth'

    def test_schema_changes(self):
        outputs = run_scenario(base_scenario)
        assert outputs['schema'][0] == {"time": {"starship"}}
        assert outputs['schema'][48] == {"time": {"starship"}}
        assert outputs['schema'][49] == {"time": {"mars_surface": {"starship"}}}

    def test_pre_launch_checks(self):
        pass
        # TODO
