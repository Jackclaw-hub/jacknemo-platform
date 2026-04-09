# JackNemo Platform - SaaS Prototyp

Dies ist ein Prototyp einer SaaS-Plattform mit Berechtigungskonzept, User-Management und Multi-Environment-Unterstützung.

## Überblick
- Modulare Flask-Anwendung mit Blueprint-Architektur
- Email-basierte Authentifizierung mit Flask-Login
- Rollenbasierte Zugriffskontrolle (RBAC)
- Verwaltung von DEV/INT/PROD Umgebungen
- Benutzer- und Profilverwaltung

## Struktur
```
/ (root)
├── app.py              # Hauptanwendung
├── auth/               # Authentifizierungsmodul
├── admin/              # Admin-Verwaltung
├── environments/       # Environment-Management
├── profile/            # Profilverwaltung
└── templates/          # HTML-Templates
    ├── auth/           # Auth-Templates
    ├── admin/          # Admin-Templates
    ├── environments/   # Environment-Templates
    └── profile/        # Profile-Templates
```

## Installation & Ausführung
```bash
# Virtuelle Umgebung erstellen
python3 -m venv venv
source venv/bin/activate

# Abhängigkeiten installieren
pip install flask flask-login

# Anwendung starten
python app.py
```

Dann im Browser öffnen: http://localhost:5000

Testzugänge:
- Admin: test@example.com / securepassword123
- User: user@example.com / userpassword123

⚠️ **Wichtiger Hinweis**: Dies ist ein Prototyp für Demonstrationzwecke. Passwörter sind NICHT gehasht! In Produktion müssten angemessene Sicherheitsmaßnahmen implementiert werden.

## Features
- Modularer Aufbau mit Flask-Blueprints
- Rollenbasierte Zugriffskontrolle (Admin/User)
- Multi-Environment-Unterstützung (DEV/INT/PROD)
- Benutzerverwaltung und -profil
- Einheitliches responsive UI
- Erweiterbare Architektur für weitere Module

## Lizenz
MIT