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
    db.create_all()
    client = app.test_client()
    yield client
    os.remove(app.config['TEST_DB_FILE'])


def test_list_no_scenario_views(client):
    data = get(client, '/api/scenario_views')
    assert data['scenario_views'] == []


def test_create_get_and_list_scenario_views(client):
    resp_data = post(client, '/api/new_scenario_view', dict(
        title="test",
        data={"layout":{"more":3}}
    ))
    scen_id = resp_data['id']

    data = get(client, '/api/scenario_views')
    assert len(data['scenario_views']) == 1
    assert data['scenario_views'][0]['id'] == scen_id

    data = get(client, f'/api/scenario_view?id={scen_id}')
    assert data['data'] == {"layout":{"more":3}}


def test_create_and_update_scenario_views(client):
    resp_data = post(client, '/api/new_scenario_view', dict(
        title="test",
        data={"layout":{"more":3}}
    ))
    scen_id = resp_data['id']

    resp_data = post(client, '/api/update_scenario_view', dict(
        id=scen_id,
        data={"layout":{"more":2}}
    ))
    data = get(client, f'/api/scenario_view?id={scen_id}')
    assert data['data'] == {"layout":{"more":2}}
