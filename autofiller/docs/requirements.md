# Anforderungen Autofiller

## MVP: Scorecard-Erstellung basierend auf User-Frage

### User Story
Als User möchte ich eine Fördermöglichkeit oder Ausschreibung beschreiben (z.B. "Künstliche Intelligenz für kleine Unternehmen in NRW"), sodass das System:
1. Relevante Förderprogramme/Ausschreibungen findet
2. Eine Scorecard erstellt, die die Passung bewertet
3. Die Ergebnisse übersichtlich präsentiert

### Akzeptanzkriterien
- [ ] User kann eine freie Textfrage eingeben
- [ ] System scraped konfigurierte Förderseiten/Ausschreibungsportale
- [ ] System extrahiert relevante Informationen (Titel, Beschreibung, Förderbetrag, Deadline,etc.)
- [ ] System bewertet jede gefundene Möglichkeit anhand der User-Frage (Scorecard)
- [ ] Scorecard zeigt: Passung %, Begründung, wichtige Details
- [ ] Ergebnisse werden nach Score sortiert angezeigt
- [ ] Alles ist dokumentiert und nachvollziehbar

### Nicht-funktionale Anforderungen
- Clean Architecture séparation von concerns
- Vollständige Dokumentation im docs/-Ordner
- Testbarer Code
- Konfigurierbare Quellen (für verschiedene Förderdatenbanken)