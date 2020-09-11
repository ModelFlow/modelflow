# Running Locally

### Using Docker

```
docker-compose up
```

### Using Python + npm

```
# ---- In one window:
# One time setup
cd backend
python3.7 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Make sure you are in your virtual environment
source venv/bin/activate

# Run the backend
python app.py

# ---- In second window:
cd frontend
npm install
npm start
```

# Frontend

### How to deploy

```
cd ...modelflow/website/frontend
npm run build
aws s3 sync build/ s3://modelflow-frontend
```

### How to setup from scratch on AWS

https://aws.amazon.com/premiumsupport/knowledge-center/cloudfront-serve-static-website/

# Backend

### How to deploy

```
cd ...modelflow/website/backend

$(aws ecr get-login --no-include-email --region us-west-2)

docker build -t modelflow .

docker tag modelflow:latest 805888055623.dkr.ecr.us-west-2.amazonaws.com/modelflow:latest

docker push 805888055623.dkr.ecr.us-west-2.amazonaws.com/modelflow:latest

eb deploy --version 4

```

### How to setup from scratch on AWS

https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-flask.html





Notes:
1. Create way to export json from models
2. Create side bar that show sliders for parameters, text boxes for others
3. Resizable and movable grid that you can put any plotly chart into

Any input change causes request new data:
- new data returns syncronously for now
- Single x(timestamps), all other selected Y
- Zoom in on one shows all

