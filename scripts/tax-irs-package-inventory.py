#!/usr/bin/env python3
"""Inventory authorized local IRS packages without executing workbook macros."""

import argparse, hashlib, json, pathlib, re
from lxml import etree
import openpyxl

p = argparse.ArgumentParser()
p.add_argument("--schemas", required=True)
p.add_argument("--rules", required=True)
p.add_argument("--repo", default=".")
a = p.parse_args()
root = pathlib.Path(a.schemas).resolve()
repo = pathlib.Path(a.repo).resolve()
ns = {"xs": "http://www.w3.org/2001/XMLSchema"}
parser = etree.XMLParser(resolve_entities=False, no_network=True, load_dtd=False)
forms = []
for file in sorted(root.rglob("*.xsd")):
    doc = etree.parse(str(file), parser)
    for element in doc.xpath("/xs:schema/xs:element", namespaces=ns):
        name = element.get("name", "")
        if name.startswith("IRS"):
            forms.append(
                {
                    "element": name,
                    "schema": str(file.relative_to(root)),
                    "fields": sorted(
                        set(element.xpath(".//xs:element/@name", namespaces=ns))
                    ),
                    "sha256": hashlib.sha256(file.read_bytes()).hexdigest(),
                }
            )
workbook = openpyxl.load_workbook(
    a.rules, read_only=True, data_only=True, keep_vba=False
)
counts = {}
active = []
for sheet in workbook:
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if not row[0]:
            continue
        status = str(row[4] or "Unspecified")
        counts[status] = counts.get(status, 0) + 1
        if status.lower() == "active":
            active.append(str(row[0]))
registry = (repo / "lib/tax-software/form-registry-2026.ts").read_text()
registered = re.findall(r"code\s*:\s*['\"]([^'\"]+)", registry)
print(
    json.dumps(
        {
            "schemaFileCount": len(list(root.rglob("*.xsd"))),
            "irsDocumentCount": len(forms),
            "registeredFormCount": len(registered),
            "businessRuleStatusCounts": counts,
            "activeRuleCount": len(active),
            "activeRuleIds": active,
            "forms": forms,
            "atsAccepted": False,
            "note": "Schema and registry presence does not establish calculation or rule implementation.",
        },
        indent=2,
    )
)
