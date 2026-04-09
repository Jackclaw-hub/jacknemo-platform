"""
Utils-Modul für die SaaS-Plattform
Enthält Hilfsfunktionen, Decorators und Utility-Klassen
"""
from functools import wraps
from flask import flash, redirect, url_for
from flask_login import current_user

def role_required(*roles):
    """
    Decorator zur Überprüfung von Benutzerrollen
    Usage: @role_required('admin', 'moderator')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                flash('Bitte melde dich zuerst an')
                return redirect(url_for('auth.login'))
            
            if current_user.role not in roles:
                flash('Zugriff verweigert: Nicht ausreichende Berechtigungen')
                return redirect(url_for('auth.login'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    """Spezial-Decorator für Admin-Zugriff"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'admin':
            flash('Zugriff verweigert: Admin-Rechte erforderlich')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def validate_email(email):
    """Einfache E-Mail-Validierung"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password_strength(password):
    """Validiert Passwortstärke"""
    if len(password) < 8:
        return False, "Passwort muss mindestens 8 Zeichen lang sein"
    
    if not any(c.isupper() for c in password):
        return False, "Passwort muss mindestens einen Großbuchstaben enthalten"
    
    if not any(c.islower() for c in password):
        return False, "Passwort muss mindestens einen Kleinbuchstaben enthalten"
    
    if not any(c.isdigit() for c in password):
        return False, "Passwort muss mindestens eine Ziffer enthalten"
    
    return True, "Passwort ist stark genug"

def format_datetime(dt):
    """Formatiert datetime für Anzeige"""
    if dt is None:
        return "Nie"
    return dt.strftime("%d.%m.%Y %H:%M")

def get_env_color(status):
    """Gibt Farbe basierend auf Environment-Status zurück"""
    colors = {
        'active': '#28a745',    # Grün
        'maintenance': '#ffc107', # Gelb
        'inactive': '#dc3545',   # Rot
        'deploying': '#17a2b8'   # Blau
    }
    return colors.get(status.lower(), '#6c757d')

class ConfigManager:
    """Einfache Konfigurationsverwaltung"""
    def __init__(self):
        self.config = {}
        self._load_defaults()
    
    def _load_defaults(self):
        self.config = {
            'APP_NAME': 'JackNemo SaaS Platform',
            'VERSION': '1.0.0',
            'DEBUG': True,
            'MAX_UPLOAD_SIZE': '16MB',
            'SESSION_TIMEOUT': 3600,  # 1 Stunde
            'PASSWORD_MIN_LENGTH': 8,
            'REQUIRE_EMAIL_VERIFICATION': False,
            'ENABLE_REGISTRATION': True,
            'DEFAULT_LANGUAGE': 'de',
            'TIMEZONE': 'UTC',
            'FEATURE_FLAGS': {
                'NEW_DASHBOARD': True,
                'ADVANCED_REPORTING': False,
                'EXPORT_FUNCTIONALITY': True,
                'API_RATE_LIMITING': True
            }
        }
    
    def get(self, key, default=None):
        return self.config.get(key, default)
    
    def set(self, key, value):
        self.config[key] = value
    
    def update(self, updates):
        self.config.update(updates)
    
    def to_dict(self):
        return self.config.copy()

# Globale Instanz
config = ConfigManager()