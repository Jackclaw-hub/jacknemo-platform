"""
Hauptanwendung der SaaS-Plattform mit modularem Design
Verwendet Flask-Blueprints für Trennung der Zuständigkeiten
"""

from flask import Flask, render_template, redirect, url_for, flash
from flask_login import LoginManager, current_user
import os

from utils import config
from auth import auth_bp
from admin import admin_bp
from environments import environments_bp
from profile import profile_bp
from api import api_bp

app = Flask(__name__)
app.config.from_mapping(config.to_dict())
app.secret_key = os.urandom(24)  # In Production: sicherer Secret Key aus Env-Var

# Flask-Login Setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'  # Redirect zu Auth-Blueprint Login

# User-Klasse für Flask-Login (muss hier definiert sein, da login_manager sie benötigt)
from flask_login import UserMixin

class User(UserMixin):
    def __init__(self, id, email, name, role):
        self.id = id
        self.email = email
        self.name = name
        self.role = role

# Simulierte User-Datenbank (in Production: richtige DB mit Password Hashing)
users = {
    'test@example.com': {
        'id': 1,
        'email': 'test@example.com',
        'password': 'securepassword123',  # In Production: gehashtes Passwort!
        'name': 'Test User',
        'role': 'admin'
    },
    'user@example.com': {
        'id': 2,
        'email': 'user@example.com',
        'password': 'userpassword123',  # In Production: gehashtes Passwort!
        'name': 'Regular User',
        'role': 'user'
    }
}

@login_manager.user_loader
def load_user(user_id):
    for email, user_data in users.items():
        if str(user_data['id']) == str(user_id):
            return User(user_data['id'], user_data['email'], user_data['name'], user_data['role'])
    return None

# Blueprints registrieren
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(environments_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(api_bp)

# Hauptroutes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('auth.login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)