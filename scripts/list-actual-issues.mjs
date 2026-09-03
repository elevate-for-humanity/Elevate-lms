#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('reports/page-audit.json', 'utf-8'));
const issues = data.pages.filter((p) => p.issueCount > 0);

const actualIssues = issues.filter((page) => {
  const hasPlaceholder = page.issues.some((i) => i.type === 'placeholder_text');
  const hasMissingHero = page.issues.some((i) => i.type === 'missing_hero_media');

  // Skip form pages
  if (
    hasPlaceholder &&
    (page.route.includes('/new') || page.route.includes('/edit') || page.route.includes('/create'))
  ) {
    return false;
  }
  // Skip redirect pages
  if (page.route.includes('[') && page.route.includes(']') && !hasMissingHero) {
    return false;
  }
  return true;
});

actualIssues.slice(0, 20).forEach((p, i) => {});

if (actualIssues.length > 20) {
}

writeFileSync('reports/actual-issues-to-fix.json', JSON.stringify(actualIssues, null, 2));
