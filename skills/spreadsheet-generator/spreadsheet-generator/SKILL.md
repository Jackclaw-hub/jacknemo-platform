---
name: spreadsheet-generator
description: Generate Excel (.xlsx) and CSV spreadsheets using Python openpyxl. Use when you need to export backlog data, tracker sheets, analytics summaries, or structured data that Ahmad or stakeholders can open in Excel/Google Sheets.
---

# Spreadsheet Generator

Creates Excel files using Python `openpyxl` (pre-installed). CSV works with built-in `csv` module.

## Basic Excel (.xlsx)

```python
import openpyxl
import os

os.makedirs("/sandbox/.openclaw-data/workspace/output", exist_ok=True)

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Backlog"

# Headers (bold)
from openpyxl.styles import Font, PatternFill, Alignment
headers = ["ID", "Title", "Owner", "Status", "Acceptance Criteria"]
for col, h in enumerate(headers, 1):
    cell = ws.cell(row=1, column=col, value=h)
    cell.font = Font(bold=True)
    cell.fill = PatternFill("solid", fgColor="4F81BD")

# Data rows
rows = [
    ("SR-001", "Push prototype to GitHub", "Jack", "TODO", "Repo exists, all 9 files committed"),
    ("SR-002", "UX audit index.html", "Jack", "TODO", "All 4 role cards have correct copy"),
]
for row_idx, row in enumerate(rows, 2):
    for col_idx, val in enumerate(row, 1):
        ws.cell(row=row_idx, column=col_idx, value=val)

# Auto column width
for col in ws.columns:
    max_len = max(len(str(c.value or "")) for c in col)
    ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

output_path = "/sandbox/.openclaw-data/workspace/output/startup-radar-backlog.xlsx"
wb.save(output_path)
print(f"Spreadsheet written to {output_path}")
```

## CSV (simpler)

```python
import csv, os
os.makedirs("/sandbox/.openclaw-data/workspace/output", exist_ok=True)
with open("/sandbox/.openclaw-data/workspace/output/backlog.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["ID", "Title", "Owner", "Status"])
    w.writerow(["SR-001", "Push prototype", "Jack", "TODO"])
```

## After Generating

```bash
cd /tmp/sr && cp /sandbox/.openclaw-data/workspace/output/*.xlsx docs/ && git add docs/ && git commit -m "[TRACKER] Updated backlog spreadsheet" && git push
```