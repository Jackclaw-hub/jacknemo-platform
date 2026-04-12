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
        'role': 'admin',
        'status': 'verified',
        'last_activity': '2026-04-12 09:15:00'
    },
    'user@example.com': {
        'id': 2,
        'email': 'user@example.com',
        'password': 'userpassword123',  # In Production: gehashtes Passwort!
        'name': 'Regular User',
        'role': 'user',
        'status': 'pending',
        'last_activity': '2026-04-11 14:30:00'
    },
    'newuser@example.com': {
        'id': 3,
        'email': 'newuser@example.com',
        'password': 'newpassword123',
        'name': 'New User',
        'role': 'user',
        'status': 'pending',
        'last_activity': '2026-04-12 10:45:00'
    },
    'flagged@example.com': {
        'id': 4,
        'email': 'flagged@example.com',
        'password': 'flagpassword123',
        'name': 'Flagged User',
        'role': 'user',
        'status': 'flagged',
        'last_activity': '2026-04-10 16:20:00'
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

# Simulierte Rollendaten
roles_data = [
    {
        'id': 1,
        'name': 'Administrator',
        'description': 'Vollzugriff auf alle Systemfunktionen',
        'permissions': [
            {'resource': 'users', 'action': 'read'},
            {'resource': 'users', 'action': 'write'},
            {'resource': 'users', 'action': 'delete'},
            {'resource': 'roles', 'action': 'read'},
            {'resource': 'roles', 'action': 'write'},
            {'resource': 'roles', 'action': 'delete'},
            {'resource': 'system', 'action': 'read'},
            {'resource': 'system', 'action': 'write'}
        ],
        'created_at': '2026-04-10 14:30:00',
        'status': 'active'
    },
    {
        'id': 2,
        'name': 'Moderator',
        'description': 'Kann Benutzer verwalten, aber keine Systemeinstellungen',
        'permissions': [
            {'resource': 'users', 'action': 'read'},
            {'resource': 'users', 'action': 'write'}
        ],
        'created_at': '2026-04-11 09:15:00',
        'status': 'active'
    },
    {
        'id': 3,
        'name': 'Support',
        'description': 'Kann Benutzerdaten einsehen, aber nicht ändern',
        'permissions': [
            {'resource': 'users', 'action': 'read'}
        ],
        'created_at': '2026-04-12 11:45:00',
        'status': 'pending'
    },
    {
        'id': 4,
        'name': 'Deprecated Role',
        'description': 'Veraltete Rolle - nicht mehr verwenden',
        'permissions': [],
        'created_at': '2026-03-15 16:20:00',
        'status': 'deprecated'
    }
]

@admin_bp.route('/roles')
@login_required
@admin_required
def roles():
    return render_template('admin/roles.html', user=current_user, roles=roles_data)

@admin_bp.route('/system')
@login_required
@admin_required
def system():
    return render_template('admin/system.html', user=current_user)