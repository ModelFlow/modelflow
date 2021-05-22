python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd modelflow
python manage.py migrate
python manage.py runserver

To seed database: 
python manage.py load_mars_project

To delete database:
webserver/db.sqlite3

If you made changes to the model you can run:
python manage.py makemigrations
python manage.py makemigrations api

