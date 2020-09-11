FROM python:3.7
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
EXPOSE 8080
COPY . .
WORKDIR /website/backend
CMD ["gunicorn", "wsgi:app", "-w 4", "-b 0.0.0.0:8080", "-t 30"]