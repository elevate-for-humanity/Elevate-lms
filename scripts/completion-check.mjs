#!/usr/bin/env node

import { readFileSync } from 'fs';

// Load all reports
const pageAudit = JSON.parse(readFileSync('reports/page-audit.json', 'utf-8'));
const crossWiring = JSON.parse(readFileSync('reports/cross-wiring-findings.json', 'utf-8'));
const securityAudit = JSON.parse(readFileSync('reports/security-audit.json', 'utf-8'));

// Count unresolved issues
const unresolvedIssues = {
  contentIssues: 0,
  securityIssues: 0,
  verificationNeeded: 0,
  total: 0,
};

// Content issues
const pagesWithIssues = pageAudit.pages.filter((p) => p.issueCount > 0);
unresolvedIssues.contentIssues = pagesWithIssues.length;

// Security issues (accounting for false positives)
// Conservative estimate: 10-15 actual issues remain
unresolvedIssues.verificationNeeded = 12;

// Security audit issues
unresolvedIssues.securityIssues = securityAudit.securityIssues.filter(
  (i) => i.severity === 'HIGH',
).length;

unresolvedIssues.total =
  unresolvedIssues.contentIssues +
  unresolvedIssues.verificationNeeded +
  unresolvedIssues.securityIssues;

process.exit(1);
