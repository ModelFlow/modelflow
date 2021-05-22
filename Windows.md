```
# One time installation
python3 -m venv venv
cd .\venv\Scripts\
.\activate
cd ..\..
pip install -r requirements.txt

# Running model
cd .\venv\Scripts\
.\activate
cd ..\..
cd .\projects\mars
python .\main.py
python -m pytest

# To run backend
# In a separate window (I was using VS Code)
cd .\venv\Scripts\
.\activate
cd ..\..
cd .\website\backend\webserver
python .\manage.py runserver

# To run frontend
# In a separate window (I was using VS Code)
# First install https://nodejs.org/en/
# If using VS Code you must right click and launch run as administrator
cd .\website\frontend\
npm install
npm start
```
