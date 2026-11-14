#!/usr/bin/env python3
"""List all fields in a PDF"""
import sys
from pypdf import PdfReader

if len(sys.argv) < 2:
    print("Usage: python list_pdf_fields.py <pdf_file>")
    sys.exit(1)

pdf_path = sys.argv[1]
reader = PdfReader(pdf_path)
fields = reader.get_fields()

print(f"Found {len(fields)} fields in {pdf_file}:")
for name, field in fields.items():
    print(f"  - {name}")
