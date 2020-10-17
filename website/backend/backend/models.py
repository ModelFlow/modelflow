from backend import db

# TODO: In frontend just load the last one
# - Make modelflow python only version so debugging is fast
# - Make it so locally can update when model updates

# Ideas:
# - pass in num timestamps as parameter for simulation
# - in top right add (save and load) scenario views

class ScenarioView(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	title = db.Column(db.String(120))
	json_data = db.Column(db.Text, nullable=False)
	created_at = db.Column(db.DateTime)
	is_hidden = db.Column(db.Boolean)
	is_default = db.Column(db.Boolean)

	def __str__(self):
		return f"{self.title}"