from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand
from backend import app, db

migrate = Migrate(app, db)
manager = Manager(app)
manager.add_command('db', MigrateCommand)

if __name__ == '__main__':
	# python manage.py db init
	# python manage.py db migrate
	# python manage.py db upgrade
	manager.run()