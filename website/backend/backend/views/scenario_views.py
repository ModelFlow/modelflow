import json
from backend import app, db
from backend.models import ScenarioView
from flask import request
from sqlalchemy.orm import defer
from datetime import datetime


@app.route('/api/scenario_views', methods=['GET'])
def get_scenario_views():
    # TODO: Handle showing hidden scenario views
    results = db.session.query(ScenarioView)
    results = results.options(defer('json_data'))
    results = results.filter(ScenarioView.is_hidden is not True)
    scenario_views_meta = []
    for row in results:
        scenario_views_meta.append(dict(
            title=row.title,
            created_at=row.created_at,
            id=row.id,
        ))
    return dict(scenario_views=scenario_views_meta)

@app.route('/api/scenario_view', methods=['GET'])
def get_scenario_view():
    scenario_view_id = int(request.args.get('id', 0))
    scenario_view = ScenarioView.query.filter(ScenarioView.id == scenario_view_id).first()
    if scenario_view is None:
        return dict(error=f"No scenario view found for id {scenario_view_id}")
    return dict(
        title=scenario_view.title,
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
        return dict(error=f"No scenario view found for id {scen_id}")
    scenario_view.json_data = json.dumps(raw['data'])
    db.session.commit()
    return dict(status="ok", id=scenario_view.id)


@app.route('/api/new_scenario_view', methods=['POST'])
def new_scenario_view():
    raw = json.loads(request.data)
    scenario_view = ScenarioView()
    scenario_view.title = raw['title']
    scenario_view.json_data = json.dumps(raw['data'])
    scenario_view.is_hidden = False
    scenario_view.created_at = datetime.now()
    db.session.add(scenario_view)
    db.session.commit()
    return dict(status="ok", id=scenario_view.id)
