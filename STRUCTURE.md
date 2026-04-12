# SaaS Plattform Prototyp - Aktuelle Struktur

## Überblick
Flask-basierte Webanwendung mit modularem Design unter Verwendung von Blueprints.

## Dateistruktur

```
/sandbox/.openclaw-data/workspace/prototype/
├── app.py                    # Hauptanwendung mit Blueprint-Registrierung
├── schema.sql               # Datenbank-Schema (users, roles, permissions)
├── venv/                    # Virtuelle Umgebung (aktuell eingeschränkt wegen Proxy)
│
├── auth/                    # Authentifizierungs-Modul
│   ├── __init__.py          # Login/Logout Logic, User-Klasse
│   └── templates/
│       └── login.html       # Login-Formular
│
├── admin/                   # Administrations-Modul
│   ├── __init__.py          # Admin-Routes, Berechtigungs-Checks
│   └── templates/
│       ├── index.html       # Admin-Übersicht
│       ├── users.html       # Benutzer-Verwaltung
│       └── roles.html       # Rollen- und Berechtigungsverwaltung
│
├── environments/            # Environment-Verwaltung
│   ├── __init__.py          # DEV/INT/PROD Environment Management
│   └── templates/
│       └── index.html       # Environment-Übersicht
│
├── profile/                 # Benutzer-Profil
│   ├── __init__.py          # Profil-Ansicht und Bearbeitung
│   └── templates/
│       └── index.html       # Profil-Übersicht
│
└── templates/               # Globale Templates
    ├── dashboard.html       # Haupt-Dashboard nach Login
    ├── index.html           # Landing Page
    └── login.html           # Globaler Login (falls verwendet)
```

## Komponenten-Übersicht

### 1. **app.py** (Hauptanwendung)
- Flask App Initialisierung
- Flask-Login Konfiguration
- Blueprint Registrierung:
  - auth_bp (url_prefix='/auth')
  - admin_bp (url_prefix='/admin')
  - environments_bp (url_prefix='/environments')
  - profile_bp (url_prefix='/profile')
- Hauptroutes: '/', '/dashboard'

### 2. **auth/** (Authentifizierung)
- **__init__.py**:
  - LoginManager Setup
  - User-Klasse (erbt von UserMixin)
  - Simulierte User-Datenbank (Mock-Daten)
  - user_loader Callback
  - /login Route (GET/POST)
  - /logout Route
- **templates/login.html**: Login-Formular mit Testzugängen Info

### 3. **admin/** (Administration)
- **__init__.py**:
  - admin_bp Blueprint
  - admin_required Decorator (Rollen-Check: nur 'admin')
  - Simulierte User-Datenbank (konsistent mit auth/)
  - Routes:
    - '/' (Admin-Übersicht)
    - '/users' (Benutzer-Verwaltung)
    - '/roles' (Rollen-Verwaltung)
    - '/system' (System-Einstellungen)
- **Templates**:
  - index.html: Admin-Dashboard mit Benutzerliste
  - users.html: Detaillierte Benutzerverwaltungstabelle
  - roles.html: Rollenliste mit Berechtigungs-Tags (neu erstellt)

### 4. **environments/** (Environment Management)
- **__init__.py**:
  - environments_bp Blueprint
  - Simulierte Environment-Daten (dev, int, prod)
  - Routes:
    - '/' (Environment-Übersicht)
    - '/<env_id>' (Environment-Detail)
    - '/<env_id>/deploy' (Deployment-Simulation)
- **templates/index.html**: Environment-Karten mit Status und Services

### 5. **profile/** (Benutzerprofil)
- **__init__.py**:
  - profile_bp Blueprint
  - Routes:
    - '/' (Profil-Übersicht)
    - '/edit' (Profil bearbeiten, GET/POST)
    - '/security' (Sicherheitseinstellungen)
- **templates/index.html**: Profil-Ansicht mit Benutzerdaten

### 6. **Datenbank (geplant)**
- **schema.sql**:
  - users Tabelle: id (UUID), email, password_hash, role, timestamps, is_active
  - roles Tabelle: id (UUID), name, description, created_at
  - permissions Tabelle: id (UUID), role_id (FK), resource, action, created_at

## Datenfluss (Mock-Modus)
1. User besucht '/' → wird zu '/auth/login' weitergeleitet (falls nicht authentifiziert)
2. Login via '/auth/login' POST → Validierung gegen Mock-User-Daten → Session gesetzt
3. Zugriff auf geschützte Routes wird über `@login_required` und Rollen-Checks geschützt
4. Alle Daten kommen aktuell aus Mock-Dictionaries in den jeweiligen Modulen
5. Bei Produktivbetrieb würde SQL-Datenbank über SQLAlchemy oder direkte DB-Verbindungen angesprochen

## Erweiterungsmöglichkeiten
1. **Datenbankanbindung**: SQLAlchemy-Modelle basierend auf schema.sql erstellen
2. **Echte Passwort-Hashing**: werkzeug.security oder bcrypt für Passwords
3. **Form-Validierung**: WTForms für robuste Form-Handhabung
4. **API-Endpunkte**: JSON-API für Frontend-Frameworks (React/Vue) hinzufügen
5. **Tests**: pytest mit Flask-Test-Client für Unit- und Integrationstests
6. **Deployment**: Dockerisierung und Kubernetes-Manifests
7. **Monitoring**: Logging, Metrics collection, Health-Checks
8. **Frontend-Erweiterung**: Moderne UI mit Bootstrap 5 oder Tailwind CSS
9. **Email-Integration**: Für Passwort-Reset und Benachrichtigungen
10. **File Uploads**: Für Profile-Pictures und Dokumenten-Management

## Aktuelle Limitierungen (aufgrund Proxy)
- Flask und dépendencies konnten nicht über pip installiert werden
- Aktuelle Funktionalität basiert auf bereits vorhandenem System-Python
- Mock-Daten simulieren DB-Interaktionen
- Echte Datenbankanbindung wäre notwendig für Produktivbetrieb

## Nächste Schritte
1. Weitere Template-Vervollständigung (system.html, profile/edit.html, etc.)
2. Verbesserung der Mock-Datenstrukturen (realistischere Rollen/Berechtigungen)
3. Hinzufügen von Flash-Nachrichten und Error Handling
4. Implementierung von sog. "Service-Layer" für bessere Trennung der Logik
5. API-Endpunkte für mögliche Frontend-Trennung vorbereiten