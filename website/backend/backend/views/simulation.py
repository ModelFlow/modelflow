import os
import time
import sys
import json
import pathlib
from backend import app
from flask import request
from flask_cors import CORS

# TODO: DO NOT HARD CODE
sys.path.insert(0, str(pathlib.Path(__file__).absolute().parents[4]))
from examples.mars.models import list_models
from modelflow.modelflow import get_params, run_sim


@app.route('/api/get_params')
def get_params_route():
    scenario_name = request.args.get("scenario", "baseline")
    scenario = get_scenario(scenario_name)

    models = list_models()

    return dict(params=get_params(scenario, models))


@app.route('/api/run_sim', methods=["POST"])
def run_sim_route():
    body = json.loads(request.data)
    scenario_name = body.get("scenario", "baseline")
    scenario = get_scenario(scenario_name)
    models = list_models()

    scenario['params'] = body['params']

    return run_sim(scenario, models, get_sim_dir())

def get_sim_dir():
    # TODO: Make generic
    abs_path = pathlib.Path(__file__).parent.parent.parent.absolute()
    abs_path = os.path.join(abs_path, 'examples', 'mars')
    return abs_path

def get_scenario(scenario_name):
    abs_path = get_sim_dir()
    abs_path = os.path.join(abs_path, 'scenarios', f'{scenario_name}.json')
    scenario = None
    with open(abs_path, 'r') as f:
        scenario = json.load(f)
    return scenario
