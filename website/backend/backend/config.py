import os
import uuid


class Config(object):
    DEBUG = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class Production(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{os.environ.get('POSTGRES_USER', 'user')}:"
        f"{os.environ.get('POSTGRES_PASS', 'pass')}@{os.environ.get('POSTGRES_HOST', '0.0.0.0')}"
        f"/{os.environ.get('POSTGRES_DB', 'modelflow')}"
    )


class Development(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{os.environ.get('POSTGRES_USER', 'user')}:"
        f"{os.environ.get('POSTGRES_PASS', 'pass')}@{os.environ.get('POSTGRES_HOST', '0.0.0.0')}"
        f"/{os.environ.get('POSTGRES_DB', 'modelflow')}"
    )

class Testing(Config):
    TESTING = True
    TEST_DB_FILE = f'/tmp/{uuid.uuid4()}.db'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + TEST_DB_FILE
