# Clean Architecture für Autofiller

## Schichten (von innen nach außen)

### 1. Entities (Geschäftskonzepte)
- Förderprogramm / Ausschreibung
- Scorecard
- UserQuery
- Bewertungskriterien

### 2. Use Cases (Anwendungslogik)
- Förderprogramme suchen
- Scorecard berechnen
- Ergebnisse filtern und sortieren
- Bericht generieren

### 3. Interface Adapter (Controller, Présenter, Gateways)
- Web Controller (falls GUI)
- Präsenter für Scorecard-Anzeige
- Gateways zu externen Diensten (Scraping, Datenbanken)

### 4. Frameworks & Tools (Details)
- Scraping-Tools (BeautifulSoup, Scrapy, Selenium)
- Web Framework (falls benötigt)
- Datenbank (falls Persistierung nötig)
- externe APIs (Förderdatenbanken)

## Abhängigkeitsregel
- Abhängigkeiten zeigen nur nach innen
- äußere Schichten kennen innere Schichten nicht
- innere Schichten wissen nichts von äußeren Schichten

## Datenfluss beim Scorecard-Prozess
1. UserQuery → Use Case: Förderprogramme suchen
2. Use Case → Gateway: Scrape konfigurierte Quellen
3. Gateway gibt Rohdaten zurück → Use Case: extrahiere Förderprogramme
4. Use Case: Für jedes Förderprogramm → Scorecard berechnen
5. Use Case → Présenter: Ergebnisse formatieren
6. Présenter → User: Scorecard-Liste