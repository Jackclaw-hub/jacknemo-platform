#!/usr/bin/env python3
"""
Preview/Check script for the SaaS Plattform Prototyp
Verifies that all expected files are in place and shows basic structure
"""

import os
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists and return status"""
    exists = os.path.isfile(filepath)
    status = "✓" if exists else "✗"
    print(f"{status} {description}: {filepath}")
    return exists

def check_dir_exists(dirpath, description):
    """Check if a directory exists and return status"""
    exists = os.path.isdir(dirpath)
    status = "✓" if exists else "✗"
    print(f"{status} {description}: {dirpath}")
    return exists

def main():
    print("=" * 60)
    print("SaaS Plattform Prototyp - Strukturübersicht & Preview")
    print("=" * 60)
    print()
    
    base_path = "/sandbox/.openclaw-data/workspace"
    prototype_path = f"{base_path}/prototype"
    
    # Check main application files
    print("HAUPTDATEIEN:")
    check_file_exists(f"{prototype_path}/app.py", "Hauptanwendung")
    check_file_exists(f"{base_path}/schema.sql", "Datenbankschema")
    print()
    
    # Check modules
    print("MODULES:")
    modules = ["auth", "admin", "environments", "profile"]
    for module in modules:
        module_path = f"{prototype_path}/{module}"
        init_file = f"{module_path}/__init__.py"
        templates_path = f"{module_path}/templates"
        
        print(f"  {module.upper()}:")
        check_file_exists(init_file, f"    {module}/__init__.py")
        check_dir_exists(templates_path, f"    {module}/templates/")
        
        # Check specific templates
        if os.path.isdir(templates_path):
            templates = [f for f in os.listdir(templates_path) if f.endswith('.html')]
            for template in templates:
                check_file_exists(f"{templates_path}/{template}", f"      {template}")
        print()
    
    # Check global templates
    print("GLOBALE TEMPLATES:")
    global_templates_path = f"{prototype_path}/templates"
    check_dir_exists(global_templates_path, "templates/")
    if os.path.isdir(global_templates_path):
        templates = [f for f in os.listdir(global_templates_path) if f.endswith('.html')]
        for template in templates:
            check_file_exists(f"{global_templates_path}/{template}", f"  {template}")
    print()
    
    # Show schema.sql content
    print("DATENBANKSCHEMA (schema.sql):")
    print("-" * 40)
    try:
        with open(f"{base_path}/schema.sql", 'r') as f:
            content = f.read()
            print(content)
    except Exception as e:
        print(f"Fehler beim Lesen von schema.sql: {e}")
    print()
    
    # Show structure documentation
    print("STRUKTURDOKUMENTATION:")
    print("-" * 40)
    structure_file = f"{base_path}/STRUCTURE.md"
    if os.path.isfile(structure_file):
        try:
            with open(structure_file, 'r') as f:
                lines = f.readlines()
                # Show first 20 lines as preview
                for i, line in enumerate(lines[:20]):
                    print(line.rstrip())
                if len(lines) > 20:
                    print("... (weitere Inhalte in STRUCTURE.md)")
        except Exception as e:
            print(f"Fehler beim Lesen von STRUCTURE.md: {e}")
    else:
        print("STRUCTURE.md nicht gefunden")
    print()
    
    # Summary
    print("ZUSAMMENFASSUNG:")
    print("-" * 40)
    print("Der Prototyp besteht aus:")
    print("  • Flask-Anwendung mit Modularen Blueprints")
    print("  • Auth-Modul (Login/Logout)")
    print("  • Admin-Modul (Benutzer-, Rollen-, Systemverwaltung)")
    print("  • Environments-Modul (DEV/INT/PROD Management)")
    print("  • Profile-Modul (Benutzerprofil-Einstellungen)")
    print("  • Vollständigem Datenbankschema für PostgreSQL")
    print("  • HTML-Templates für alle Views")
    print()
    print("HINWEIS: Aktueller Stand verwendet Mock-Daten aufgrund")
    print("         von Proxy-Problemen bei der Abhängigkeitsinstallation.")
    print("         Für produktiven Einsatz wären Flask, Flask-Login und")
    print("         psycopg2-binary erforderlich.")
    print()
    print("NÄCHSTE SCHritte:")
    print("  1. Weitere Templates vervollständigen (system.html, etc.)")
    print("  2. Mock-Daten realistischer gestalten")
    print("  3. API-Endpunkte für JSON-Schnittstelle hinzufügen")
    print("  4. Form-Validierung und Error Handling verbessern")
    print("=" * 60)

if __name__ == "__main__":
    main()