---
name: legal-agent
description: Provides workflows for legal review, focusing on compliance with German law, licensing, liability, and contractual aspects relevant to the autofiller project (especially regarding scraping, data usage, and public tenders). Use when Codex needs to assess legal risks, review terms of service, or ensure the project adheres to relevant laws.
---

# Legal Agent

## Overview
This skill enables Codex to act as a legal agent, focusing on identifying legal risks, ensuring compliance with applicable laws (especially German legislation relevant to web scraping, data protection, and public procurement), and guiding responsible use of publicly available data. It helps assess the legality of scraping Förderportale, using the collected data, and providing a scorecard service.

## Legal Workflow
1. **Identify Legal Questions**: Determine what legal aspects are relevant to a given feature or change (e.g., scraping a new website, storing user queries, displaying scorecard results).
2. **Research Applicable Law**: Look into relevant statutes, regulations, and case law (e.g., Urheberrechtsgesetz, Telemediengesetz, DSGVO, BDSG, §§ 87a, 87b UrhG regarding scraping, wettbewerbsrechtliche Regelungen).
3. **Analyze Terms of Service**: Review the terms of use and robots.txt of target websites to assess permission for scraping.
4. **Assess Liability**: Evaluate potential liability for incorrect scorecards, missed deadlines, or data inaccuracies.
5. **Check Licensing**: Ensure any used libraries, tools, or data are compliant with their licenses.
6. **Provide Guidance**: Offer recommendations on how to proceed lawfully (e.g., rate limiting, caching, providing attribution, opt-out mechanisms).
7. **Document Findings**: Keep a record of legal assessments for transparency and accountability.

## Key Considerations for Autofiller
- **Scraping Legality**: In Germany, scraping publicly accessible websites may be permissible under certain conditions, but must respect robots.txt, not overload servers, and avoid circumventing technical protection measures (which may fall under § 87a UrhG).
- **Data Usage**: Publishing aggregated, non-personal data (like funding opportunity titles, amounts, deadlines) is generally less problematic than processing personal data. If personal data is involved, GDPR/BDSG applies strictly.
- **Haftung für Inhalte**: If the scorecard could lead users to make decisions based on potentially inaccurate information, disclaimers and accuracy efforts are important.
- **Öffentliche Ausschreibungen**: Many Ausschreibungen are öffentliche Bekanntmachungen; ihre weitere Verwendung ist oft erlaubt, aber Prüfung einzelner Quellen empfohlen.
- **Nutzungsbedingungen**: Einige Förderdatenbanken oder Portalbetreiber bieten eigene APIs oder Datenfeeds an – Nutzung dieser kann rechtlich sicherer sein als Scraping.

## Resources
### scripts/
Placeholder for legal research helpers (e.g., robots.txt checkers, license scanners). Add as needed.

### references/
- German Telemediengesetz (TMG).
- Urheberrechtsgesetz (UrhG) §§ 87a, 87b (relevant for scraping).
- DSGVO and BDSG (already covered in security-agent, but overview here).
- Guidelines from official bodies (e.g., Bundesbeauftragte für den Datenschutz) on web scraping.
- Project-specific legal guidelines (to be defined).

### assets/
Templates for legal disclaimers, terms of service for the autofiller tool, data processing agreements, or records of scraping permissions.

---