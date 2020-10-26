import os
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)

app.config.from_object(os.environ.get('APP_CONFIG', 'backend.config.Development'))

db = SQLAlchemy(app)

from backend.models import *  # NOQA
from backend.views.scenario_views import *  # NOQA
from backend.views.server_health import *  # NOQA
from backend.views.simulation import *  # NOQA