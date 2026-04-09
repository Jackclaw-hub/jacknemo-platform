"""
Profile-Modul für die SaaS-Plattform
Verwaltet Benutzerprofile und Einstellungen
"""
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user

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
        # Hier würde die eigentliche Aktualisierung der Profildaten stattfinden
        flash('Profil erfolgreich aktualisiert')
        return redirect(url_for('profile.index'))
    return render_template('profile/edit.html', user=current_user)

@profile_bp.route('/security')
@login_required
def security():
    return render_template('profile/security.html', user=current_user)