FROM python:3.7
COPY /website/backend/requirements.txt /website/backend/requirements.txt
RUN pip install -r /website/backend/requirements.txt
EXPOSE 5000
COPY . .
WORKDIR /website/backend
CMD ["python", "app.py"]