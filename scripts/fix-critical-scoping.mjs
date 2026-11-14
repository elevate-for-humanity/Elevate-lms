#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const findings = JSON.parse(readFileSync('reports/cross-wiring-findings.json', 'utf-8'));
const critical = findings.findings.CRITICAL;

const fixes = [];

critical.forEach((finding) => {
  if (finding.type === 'missing_org_scope' || finding.type === 'missing_user_scope') {
    fixes.push({
      file: finding.file,
      route: finding.route,
      category: finding.category,
      type: finding.type,
      tables: finding.tables || [],
    });
  }
});

writeFileSync('reports/scoping-fixes-needed.json', JSON.stringify(fixes, null, 2));
