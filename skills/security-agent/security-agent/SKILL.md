---
name: security-agent
description: Provides workflows for security analysis, bug discovery, and ensuring compliance with data protection regulations (GDPR, German Datenschutz) in the autofiller project. Use when Codex needs to review code for security vulnerabilities, perform threat modeling, or verify data handling practices.
---

# Security Agent

## Overview
This skill enables Codex to act as a security and critical colleague agent, focusing on discovering bugs, security issues, and ensuring compliance with data protection laws (especially GDPR and German Datenschutz). It provides guidance for performing security reviews, vulnerability assessments, and privacy impact analyses.

## Security Workflow
1. **Threat Modeling**: Identify potential threats and attack surfaces (e.g., scraping endpoints, data storage, user input handling).
2. **Vulnerability Scanning**: Look for common security issues (injection, improper error handling, insecure dependencies).
3. **Data Flow Analysis**: Trace how personal data flows through the system (collection, processing, storage, sharing).
4. **Compliance Check**: Verify adherence to GDPR principles (lawfulness, purpose minimization, data minimization, storage limitation, integrity, confidentiality) and German Datenschutz-specific requirements.
5. **Bug Hunting**: Actively look for logic errors, edge cases, and usability issues that could lead to security or compliance problems.
6. **Reporting**: Document findings with severity, location, impact, and remediation suggestions.
7. **Follow-up**: Ensure issues are addressed in subsequent development cycles.

## Key Focus Areas
- **Data Protection**: Ensuring any personal data collected during scraping is handled lawfully.
- **Input Validation**: Validating and sanitizing user queries to prevent injection.
- **Secure Scraping**: Respecting robots.txt, rate limiting, and terms of target websites.
- **Error Handling**: Avoiding leakage of sensitive information in error messages.
- **Dependencies**: Checking for known vulnerabilities in used libraries.
- **Logging & Monitoring**: Ensuring appropriate logs without storing sensitive data unnecessarily.
- **Consent & Transparency**: If applicable, mechanisms for user consent and information provision.

## GDPR/Datenschutz Checklist
- [ ] Legal basis for data processing identified and documented.
- [ ] Data minimization: only necessary data collected.
- [ ] Purpose limitation: data used only for specified, explicit purposes.
- [ ] Storage limitation: data not kept longer than needed.
- [ ] Integrity and confidentiality: appropriate security measures.
- [ ] Rights of data subjects: access, rectification, erasure, etc. considered.
- [ ] Data processing agreements if third parties involved.
- [ ] Records of processing activities (if required).

## Resources
### scripts/
Placeholder for security scanning scripts (e.g., dependency checkers, custom vulnerability detectors). Add as needed.

### references/
- GDPR Article 5 (principles).
- BDSG (German Federal Data Protection Act) highlights.
- OWASP Top Ten.
- Cheat sheet series from OWASP.
- Project-specific security guidelines (to be defined).

### assets/
Templates for security reports, threat models, data flow diagrams, or DPIA (Data Protection Impact Assessment) forms.

---