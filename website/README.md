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
python run_server.py

# ---- In second window:
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8080/api
npm start
```

# Frontend

### How to deploy

```
cd ...modelflow/website/frontend
export REACT_APP_API_URL=/api
npm run build
aws s3 sync build/ s3://modelflow-frontend
```

### How to setup from scratch on AWS

https://aws.amazon.com/premiumsupport/knowledge-center/cloudfront-serve-static-website/

# Backend

### How to deploy

```
cd to root of modelflow

aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 805888055623.dkr.ecr.us-west-2.amazonaws.com

docker build -t modelflow . -f website/backend/Dockerfile

docker tag modelflow:latest 805888055623.dkr.ecr.us-west-2.amazonaws.com/modelflow:latest

docker push 805888055623.dkr.ecr.us-west-2.amazonaws.com/modelflow:latest

cd ...website/backend/aws_deploy

For first time:
pip install awsebcli
eb init

eb deploy

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

# TODO

- Make a staging environment
