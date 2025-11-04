from flask import Flask
from config import Config
from .services.gemini_service import GeminiService
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager

db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
login.login_view = 'main.login'
gemini_service = None

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)

    global gemini_service
    if app.config['GEMINI_API_KEY']:
        gemini_service = GeminiService(app.config['GEMINI_API_KEY'])

    from app.main.routes import main
    app.register_blueprint(main)

    return app

from app import models
