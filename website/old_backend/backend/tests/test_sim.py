import pytest
import os
from common import get, post
import sys
import pathlib

os.environ['APP_CONFIG'] = 'backend.config.Testing'
# TODO: Figure out a way to not need this import
sys.path.insert(0, str(pathlib.Path(__file__).parents[2].absolute()))

from backend import app, db  # NOQA


@pytest.fixture
def client():
    if os.path.exists(app.config['TEST_DB_FILE']):
        os.remove(app.config['TEST_DB_FILE'])
    db.create_all()
    client = app.test_client()
    yield client
    os.remove(app.config['TEST_DB_FILE'])

def test_run_sim(client):

    scenario = {
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
    # TODO
    resp_data = post(client, '/api/import_scenario', ))

    resp_data = post(client, '/api/run_sim', dict(scenario_id=resp_data['id'], output_keys=["time___current_utc"]))
    assert list(resp_data['output_states'].keys()) == ['time___current_utc']
