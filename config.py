import os

basedir = os.path.abspath(os.path.dirname(__file__))

# Manually load .env for flask commands
try:
    with open(os.path.join(basedir, '.env')) as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key.strip()] = value.strip().strip('"\'')
except FileNotFoundError:
    pass


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    GEMINI_API_KEY = os.environ.get('GOOGLE_API_KEY') or os.environ.get('GEMINI_API_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
