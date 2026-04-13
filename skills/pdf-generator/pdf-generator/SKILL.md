---
name: pdf-generator
description: Generate PDF documents (reports, specs, sprint summaries, user stories) using Python fpdf2. Use when you need to create a shareable PDF document — spec sheets, sprint reports, acceptance criteria docs, progress updates.
---

# PDF Generator

Creates PDF files using Python `fpdf2` (pre-installed).

## Basic Usage

```python
from fpdf import FPDF
import os

os.makedirs("/sandbox/.openclaw-data/workspace/output", exist_ok=True)

pdf = FPDF()
pdf.set_margins(15, 15, 15)
pdf.add_page()

# Title
pdf.set_font("Helvetica", "B", 18)
pdf.cell(0, 12, "Startup Radar — Sprint Report", ln=True)
pdf.ln(4)

# Section header
pdf.set_font("Helvetica", "B", 13)
pdf.cell(0, 9, "Sprint 0 Completed", ln=True)
pdf.ln(2)

# Body text
pdf.set_font("Helvetica", size=11)
pdf.multi_cell(0, 7, "SR-001: Prototype pushed to GitHub. All files committed and accessible at https://github.com/...")
pdf.ln(3)

output_path = "/sandbox/.openclaw-data/workspace/output/sprint-report.pdf"
pdf.output(output_path)
print(f"PDF written to {output_path}")
```

## After Generating

Push to GitHub so Ahmad can download it:

```bash
cd /tmp/sr && cp /sandbox/.openclaw-data/workspace/output/sprint-report.pdf docs/ && git add docs/ && git commit -m "[REPORT] Sprint 0 summary PDF" && git push
```

## Multi-page with table

```python
from fpdf import FPDF
pdf = FPDF()
pdf.add_page()
pdf.set_font("Helvetica", "B", 12)

# Table header
for col in ["ID", "Title", "Status"]:
    pdf.cell(45, 8, col, border=1)
pdf.ln()

pdf.set_font("Helvetica", size=10)
rows = [("SR-001", "Push prototype", "DONE"), ("SR-002", "UX audit", "IN PROGRESS")]
for row in rows:
    for cell in row:
        pdf.cell(45, 7, cell, border=1)
    pdf.ln()

pdf.output("/sandbox/.openclaw-data/workspace/output/backlog-table.pdf")
```