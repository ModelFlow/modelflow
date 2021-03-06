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
    resp_data = post(client, '/api/run_sim', {"params":[{"agent":"MassSimulator","index":2,"key":"mass","new_key":"MassSimulator_mass","source":"fake","units":"kg","value":100000000},{"agent":"MassSimulator","index":3,"key":"volume","new_key":"MassSimulator_volume","source":"fake","units":"m3","value":100000000},{"agent":"MassSimulator","index":2,"key":"mass","new_key":"MassSimulator_mass","source":"fake","units":"kg","value":100000000},{"agent":"MassSimulator","index":3,"key":"volume","new_key":"MassSimulator_volume","source":"fake","units":"m3","value":100000000},{"agent":"Starship","description":"The UTC time that starship heads from LEO to Mars","index":4,"key":"launch_utc","new_key":"Starship_launch_utc","notes":"This is one hour past the simulation start time as the time increment will happen before this model","source":"Spreadsheet of launch windows","units":"UTC Timestamp","value":1794733200},{"agent":"Starship","description":"The volume of pressurized cargo that is able to be transported","index":5,"key":"pressurized_cargo_volume","new_key":"Starship_pressurized_cargo_volume","source":"FAKE","units":"m3","value":100000},{"agent":"Starship","description":"The volume of unpressurized cargo that is able to be transported","index":6,"key":"unpressurized_cargo_volume","new_key":"Starship_unpressurized_cargo_volume","source":"FAKE","units":"m3","value":0},{"agent":"Starship","category":"advanced","description":"Trigger a simulation warning if mass below this level","index":7,"key":"mass_utilization_warning_threshold","new_key":"Starship_mass_utilization_warning_threshold","source":"none","units":"percent","value":0.7},{"agent":"Starship","category":"advanced","description":"Trigger a simulation warning if volume below this level","index":8,"key":"volume_utilization_warning_threshold","new_key":"Starship_volume_utilization_warning_threshold","source":"none","units":"percent","value":0.7},{"agent":"Starship","description":"Rough Travel Days to go from Earth to Mars during optimal low energy transfer window","index":9,"key":"travel_days_to_mars","new_key":"Starship_travel_days_to_mars","source":"https://en.wikipedia.org/wiki/Mars_Direct","units":"days","value":180},{"agent":"Starship","description":"Rough Travel Days to go from Mars to Earth during optimal low energy transfer window","index":10,"key":"travel_days_from_mars","new_key":"Starship_travel_days_from_mars","notes":"Assumed to be same as to Mars. Not sure if that's correct","source":"https://en.wikipedia.org/wiki/Mars_Direct","units":"days","value":180},{"agent":"Starship","description":"The days this Starship should stay on surface before returning to Earth","index":11,"key":"mars_stay_days","new_key":"Starship_mars_stay_days","source":"https://en.wikipedia.org/wiki/Mars_Direct","units":"days","value":540},{"agent":"Starship","confidence":9,"description":"The maximum payload mass that can be taken from low earth orbit to Mars surface","index":12,"key":"max_payload_from_leo_to_mars","new_key":"Starship_max_payload_from_leo_to_mars","source":"SpaceX website","units":"kg","value":10000},{"agent":"Starship","confidence":0,"description":"The maximum payload mass that can be taken from Mars surface to Earth surface","index":13,"key":"max_payload_from_mars_to_earth","new_key":"Starship_max_payload_from_mars_to_earth","source":"none","units":"kg","value":10000},{"agent":"Starship","confidence":0,"description":"The distance per hour that the starship travels to or away from the sun","index":14,"key":"distance_change_per_hour","new_key":"Starship_distance_change_per_hour","notes":"This is an ultra rough number used for first order calcs of pv generation","source":"fake","units":"km/h","value":1}],
    "output_keys":["time___current_utc"]})
    assert list(resp_data['output_states'].keys()) == ['time___current_utc']
