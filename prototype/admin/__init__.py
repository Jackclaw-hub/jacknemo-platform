"""
Admin-Modul für die SaaS-Plattform
Verwaltet Benutzer, Rollen und Systemeinstellungen
Nur für Administratoren zugänglich
"""
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user

# Blueprint erstellen
admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# Simulierte User-Datenbank (sollte eigentlich aus der gleichen Quelle wie im Auth-Modul kommen)
# In einer echten Anwendung würden wir hier auf eine gemeinsame Datenquelle zugreifen
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

def admin_required(f):
    """Decorator um sicherzustellen, dass nur Admins auf die Route zugreifen können"""
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'admin':
            flash('Zugriff verweigert: Admin-Rechte erforderlich')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@admin_bp.route('/')
@login_required
@admin_required
def index():
    return render_template('admin/index.html', user=current_user, users=users)

@admin_bp.route('/users')
@login_required
@admin_required
def users():
    return render_template('admin/users.html', user=current_user, users=users)

@admin_bp.route('/roles')
@login_required
@admin_required
def roles():
    return render_template('admin/roles.html', user=current_user)

@admin_bp.route('/system')
@login_required
@admin_required
def system():
    return render_template('admin/system.html', user=current_user)