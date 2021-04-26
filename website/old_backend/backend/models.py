import enum
from inspect import inspect
from backend import db

class ToDictMixin(object):
    def todict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}

class User(ToDictMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120))
    email = db.Column(db.String(120))


class Project(ToDictMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    description = db.Column(db.Text, nullable=False)
    is_hidden = db.Column(db.Boolean)

    scenario_views = db.relationship("ScenarioView", back_populates="project")
    scenarios = db.relationship("Scenario", back_populates="project")
    model_classes = db.relationship("ModelClass", back_populates="project")

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship("User", lazy=True)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)

    def __str__(self):
        return f"{self.name}"


class ScenarioView(ToDictMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    json_data = db.Column(db.Text, nullable=False)
    is_hidden = db.Column(db.Boolean)
    is_default = db.Column(db.Boolean)

    scenario_id = db.Column(db.Integer, db.ForeignKey('scenario.id'))
    scenario = db.relationship("Scenario", back_populates="scenario_views", lazy=True)

    project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
    project = db.relationship("Project", back_populates="scenario_views", lazy=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship("User", lazy=True)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)

    def __str__(self):
        return f"{self.name}"

class Scenario(ToDictMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    json_data = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime)
    is_hidden = db.Column(db.Boolean)
    scenario_views = db.relationship("ScenarioView", back_populates="scenario")
    model_instances = db.relationship("Model", back_populates="model")

    max_steps = db.Column(db.Integer)

    project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
    project = db.relationship("Scenario", back_populates="scenarios", lazy=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship("User", lazy=True)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)

    def __str__(self):
        return f"{self.name}"


class ScenarioRunStatus(enum.Enum):
    QUEUED = "param"
    RUNNING = "state"
    SUCCESS = "state"
    ERROR = "state"

class ScenarioRun(ToDictMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)

    scenario_id = db.Column(db.Integer, db.ForeignKey('scenario.id'))
    scenario = db.relationship("Scenario", lazy=True)

    status = db.Column(db.Enum(ScenarioRunStatus))
    results_path = db.Column(db.Text)


    created_at = db.Column(db.DateTime)
    is_hidden = db.Column(db.Boolean)
    scenario_views = db.relationship("ScenarioView", back_populates="scenario")
    model_instances = db.relationship("Model", back_populates="model")

    max_steps = db.Column(db.Integer)

    project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
    project = db.relationship("Scenario", back_populates="scenarios", lazy=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship("User", lazy=True)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)

    def __str__(self):
        return f"{self.name}"





class ModelInstances(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64))
    created_at = db.Column(db.DateTime)

    scenario_id = db.Column(db.Integer, db.ForeignKey('scenario.id'))
    scenario = db.relationship("Scenario", back_populates="model_instances", lazy=True)

    model_class_id = db.Column(db.Integer, db.ForeignKey('model_class.id'))
    model_class = db.relationship("ModelClass", lazy=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship("User", lazy=True)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)

class AttributeOverride(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    value = db.Column(db.String(64))

    default_attribute_id = db.Column(db.Integer, db.ForeignKey('default_attribute.id'))
    default_attribute = db.relationship("DefaultAttribute")

    scenario_id = db.Column(db.Integer, db.ForeignKey('scenario.id'))
    scenario = db.relationship("Scenario", back_populates="attribute_overrides", lazy=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship("User", lazy=True)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)

class AttributeType(enum.Enum):
    PARAM = "param"
    STATE = "state"

class DefaultAttribute(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    kind = db.Column(db.Enum(AttributeType))
    units = db.Column(db.String(64))
    is_private = db.Column(db.Boolean)
    value = db.Column(db.String(64))
    notes = db.Column(db.Text)
    confidence = db.Column(db.Integer)
    source = db.Column(db.Text)

    scenario_id = db.Column(db.Integer, db.ForeignKey('scenario.id'))
    scenario = db.relationship("Scenario", back_populates="scenario_views", lazy=True)

    model_class_id = db.Column(db.Integer, db.ForeignKey('model_class.id'))
    model_class = db.relationship("ModelClass")


class AttributeSuggestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64))
    description = db.Column(db.String(256))
    code = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime)
    is_hidden = db.Column(db.Boolean)
    source = db.Column(db.Text)
    notes = db.Column(db.Text)

    scenario_id = db.Column(db.Integer, db.ForeignKey('scenario.id'))
    scenario = db.relationship("Scenario", back_populates="scenario_views", lazy=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship("User", lazy=True)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)


class AttributeSuggestionComment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64))
    description = db.Column(db.String(256))
    code = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime)
    is_hidden = db.Column(db.Boolean)

    scenario_id = db.Column(db.Integer, db.ForeignKey('scenario.id'))
    scenario = db.relationship("Scenario", back_populates="scenario_views", lazy=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship("User", lazy=True)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)


class ModelClass(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64))
    description = db.Column(db.String(256))
    run_step_code = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime)
    is_hidden = db.Column(db.Boolean)

    scenario_id = db.Column(db.Integer, db.ForeignKey('scenario.id'))
    scenario = db.relationship("Scenario", back_populates="scenario_views", lazy=True)

    project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
    project = db.relationship("ModelClass", back_populates="model_classes", lazy=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship("User", lazy=True)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)

    def __str__(self):
        return f"{self.name}"