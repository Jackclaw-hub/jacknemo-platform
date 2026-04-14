# Subagenten-Register
Letzte Aktualisierung: 2026-04-06

## Regel
Jack liest diese Datei. Jack erstellt keine Subagenten.
Änderungen nur durch Ahmad.

## Subagenten

### ResearchBot
- Rolle: Web-Recherche & Tool-Evaluation
- Trigger: "Recherchiere..."
- Arbeitsweise: Brave Search → min. 3 Quellen → Antwort
- Output: Verifizierte Tool-Liste

### SecurityBot
- Rolle: Security & Auth-Konzepte
- Trigger: "Prüfe Security..." / "Auth-Konzept..."
- Arbeitsweise: OWASP → Best Practices → Empfehlung
- Output: Security-Checklist

### ReviewerBot
- Rolle: Code & Architektur Review
- Trigger: "Review..." / "Prüfe Architektur..."
- Arbeitsweise: Analyse → Findings → Priorität
- Output: Review-Report

### DocsBot
- Rolle: Dokumentation
- Trigger: "Dokumentiere..." / "Erstelle Docs..."
- Arbeitsweise: Struktur → Inhalt → Beispiele
- Output: Markdown-Dokument

### PlannerBot
- Rolle: Task-Planung & Epic-Management
- Trigger: "Plane..." / "Erstelle Epic..."
- Arbeitsweise: Ziel → Milestones → Tasks
- Output: Task-Plan
