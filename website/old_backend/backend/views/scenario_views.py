import os
import json
from backend import app, db
from backend.models import ScenarioView
from flask import request
from sqlalchemy.orm import defer
from datetime import datetime


@app.route('/api/scenario_views', methods=['GET'])
def get_scenario_views():
    print("INSIDE LIST SCENARIO VIEWS")
    # TODO: Handle showing hidden scenario views
    results = db.session.query(ScenarioView)
    results = results.options(defer('json_data'))
    # NOTE: is_hidden is not True did not work
    results = results.filter(ScenarioView.is_hidden == False)
    scenario_views_meta = []
    for row in results:
        scenario_views_meta.append(dict(
            name=row.name,
            created_at=row.created_at,
            id=row.id
        ))
    return dict(scenario_views=scenario_views_meta)

@app.route('/api/scenario_view', methods=['GET'])
def get_scenario_view():
    scenario_view_id = int(request.args.get('id', 0))
    print(f"the scenario view is {request.args['id']}")
    print(scenario_view_id)
    scenario_view = ScenarioView.query.filter(ScenarioView.id == scenario_view_id).first()
    print(f"loading view: {scenario_view}")
    if scenario_view is None:
        return dict(error=f'No scenario view found for id {scenario_view_id}')
    return dict(
        name=scenario_view.name,
        id=scenario_view.id,
        created_at=scenario_view.created_at,
        data=json.loads(scenario_view.json_data)
    )

@app.route('/api/update_scenario_view', methods=['POST'])
def update_scenario_view():
    raw = json.loads(request.data)
    scen_id = raw['id']

    scenario_view = ScenarioView.query.filter(ScenarioView.id == scen_id).first()
    if scenario_view is None:
        return dict(error=f'No scenario view found for id {scen_id}')
    scenario_view.json_data = json.dumps(raw['data'])
    db.session.commit()
    return dict(status='ok', id=scenario_view.id)


@app.route('/api/new_scenario_view', methods=['POST'])
def new_scenario_view():
    raw = json.loads(request.data)
    scenario_view = ScenarioView()
    scenario_view.name = raw['name']
    scenario_view.json_data = json.dumps(raw['data'])
    scenario_view.is_hidden = False
    scenario_view.created_at = datetime.now()
    db.session.add(scenario_view)
    db.session.commit()
    return dict(status='ok', id=scenario_view.id)

@app.route('/api/seed_data', methods=['GET'])
def seed_data_route():
    seed_data()
    return {'status': 'ok'}


@app.route('/api/clear_data', methods=['GET'])
def clear_data_route():
    if os.environ.get('POSTGRES_PASS') is not None:
        if request.args.get('pass') != os.environ.get('POSTGRES_PASS'):
            return {'status': 'unauthorized'}
    num_rows_deleted = db.session.query(ScenarioView).delete()
    db.session.commit()
    return {'deleted': num_rows_deleted}


@app.route('/api/hide_scenario_view', methods=['GET'])
def hide_scenario_view():
    scen_id = request.args['id']
    scenario_view = ScenarioView.query.filter(ScenarioView.id == scen_id).first()
    if scenario_view is None:
        return dict(error=f'No scenario view found for id {scen_id}')
    scenario_view.is_hidden = True
    db.session.commit()
    return dict(status='ok', id=scenario_view.id)

def seed_data():
    scenario_count = db.session.query(ScenarioView).count()
    if scenario_count == 0:
        print('Seeding new scenario view...')
        scenario_view = ScenarioView()
        scenario_view.name = 'Default View'
        scenario_view.json_data = json.dumps({
            'paramValues': {
                'dc_capacity_kwh': 9000,
            },
            'tabs': [
                {
                    'id': 'test',
                    'name': 'Test'
                }
            ],
            'selectedTabId': 'test',
            'tabsContent': {
                'test': {
                    'cards': {
                        'initial1': {
                            'outputKey': 'time___current_utc'
                        }
                    },
                    'layout': {
                        "lg":[
                            {
                                'i': 'initial1',
                                'x': 0,
                                'y': 0,
                                'w': 6,
                                'h': 6
                            }
                        ]
                    }
                }
            }
        })
        scenario_view.is_hidden = False
        scenario_view.created_at = datetime.now()
        db.session.add(scenario_view)
        db.session.commit()