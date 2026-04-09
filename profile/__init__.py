"""
Profile-Modul für die SaaS-Plattform
Verwaltet Benutzerprofile und Einstellungen
"""
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from utils import validate_email, validate_password_strength

# Blueprint erstellen
profile_bp = Blueprint('profile', __name__, url_prefix='/profile')

@profile_bp.route('/')
@login_required
def index():
    return render_template('profile/index.html', user=current_user)

@profile_bp.route('/edit', methods=['GET', 'POST'])
@login_required
def edit():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        
        # Validierung
        if not name or not name.strip():
            flash('Name ist erforderlich')
            return redirect(url_for('profile.edit'))
        
        if not email or not validate_email(email):
            flash('Bitte gib eine gültige E-Mail-Adresse ein')
            return redirect(url_for('profile.edit'))
        
        # Hier würde eigentlich die Datenbank aktualisiert werden
        # Für den Prototypen simulieren wir die Aktualisierung
        current_user.name = name.strip()
        current_user.email = email.lower().strip()
        
        flash('Profil erfolgreich aktualisiert')
        return redirect(url_for('profile.index'))
    
    return render_template('profile/edit.html', user=current_user)

@profile_bp.route('/security')
@login_required
def security():
    return render_template('profile/security.html', user=current_user)

@profile_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')
    
    # Validierung
    if not current_password:
        flash('Aktuelles Passwort ist erforderlich')
        return redirect(url_for('profile.security'))
    
    if not new_password:
        flash('Neues Passwort ist erforderlich')
        return redirect(url_for('profile.security'))
    
    if new_password != confirm_password:
        flash('Passwörter stimmen nicht überein')
        return redirect(url_for('profile.security'))
    
    # Passwortstärke prüfen
    is_strong, message = validate_password_strength(new_password)
    if not is_strong:
        flash(f'Passwort ist nicht stark genug: {message}')
        return redirect(url_for('profile.security'))
    
    # In einer echten Anwendung würden wir hier:
    # 1. Das aktuelle Passwort verifizieren (gegen gehashtes in DB)
    # 2. Das neue Passwort hashen und in der DB speichern
    # Für den Prototypen akzeptieren wir einfach das neue Passwort
    
    flash('Passwort erfolgreich geändert')
    return redirect(url_for('profile.security'))