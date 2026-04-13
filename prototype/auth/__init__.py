"""
Auth-Modul für die SaaS-Plattform
Handelt Login, Logout, Registrierung und Session-Management
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user

# Blueprint erstellen
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# LoginManager wird in der main app initialisiert
login_manager = LoginManager()

# Simulierte User-Datenbank (würde in Produktion durch echte DB ersetzt)
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

class User(UserMixin):
    def __init__(self, id, email, name, role):
        self.id = id
        self.email = email
        self.name = name
        self.role = role

@login_manager.user_loader
def load_user(user_id):
    for email, user_data in users.items():
        if str(user_data['id']) == str(user_id):
            return User(user_data['id'], user_data['email'], user_data['name'], user_data['role'])
    return None

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        if email in users and users[email]['password'] == password:
            user = User(users[email]['id'], users[email]['email'], users[email]['name'], users[email]['role'])
            login_user(user)
            return redirect(url_for('main.index'))  # Weiterleitung zum Main-Dashboard
        else:
            flash('Ungültige E-Mail oder Passwort')
    
    return render_template('auth/login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))