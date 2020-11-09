FROM python:3.7
COPY prod_requirements.txt prod_requirements.txt
RUN pip install -r prod_requirements.txt
EXPOSE 8080
COPY . .
WORKDIR /website/backend
CMD ["gunicorn", "backend:app", "--log-level=debug", "-w 4", "-b 0.0.0.0:8080", "-t 30"]