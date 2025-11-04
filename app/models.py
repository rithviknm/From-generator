import datetime
from app import db, login
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from flask_login import UserMixin

@login.user_loader
def load_user(id):
    return User.query.get(int(id))

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(256))
    forms = db.relationship('Form', backref='author', lazy='dynamic')

    def __repr__(self):
        return '<User {}>'.format(self.email)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Form(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(140))
    description = db.Column(db.String(500))
    theme = db.Column(db.String(50))
    url_slug = db.Column(db.String(8), unique=True, index=True)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    fields = db.relationship('FormField', backref='form', lazy='dynamic', cascade="all, delete-orphan")
    responses = db.relationship('FormResponse', backref='form', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return '<Form {}>'.format(self.title)

class FormField(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(140))
    field_type = db.Column(db.String(50))
    options = db.Column(db.String(500))  # For select, radio, etc.
    required = db.Column(db.Boolean, default=False)
    form_id = db.Column(db.Integer, db.ForeignKey('form.id'))

    def __repr__(self):
        return '<FormField {}>'.format(self.label)

class FormResponse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.datetime.utcnow)
    form_id = db.Column(db.Integer, db.ForeignKey('form.id'))
    answers = db.relationship('ResponseAnswer', backref='response', lazy='dynamic', cascade="all, delete-orphan")

class ResponseAnswer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    field_id = db.Column(db.Integer, db.ForeignKey('form_field.id'))
    value = db.Column(db.String(2000))
    response_id = db.Column(db.Integer, db.ForeignKey('form_response.id'))
