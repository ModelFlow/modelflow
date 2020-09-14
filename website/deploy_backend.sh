echo "Deploying Backend..."
cd ..
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 805888055623.dkr.ecr.us-west-2.amazonaws.com
docker build -t modelflow . -f website/backend/Dockerfile
docker tag modelflow:latest 805888055623.dkr.ecr.us-west-2.amazonaws.com/modelflow:latest
docker push 805888055623.dkr.ecr.us-west-2.amazonaws.com/modelflow:latest
cd website/backend/aws_deploy
eb deploy
cd ../../..