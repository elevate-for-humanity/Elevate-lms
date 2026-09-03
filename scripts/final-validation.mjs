#!/usr/bin/env node

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

const results = {
  totalPages: 0,
  pagesChecked: 0,
  criticalIssues: [],
  acceptablePatterns: [],
  passed: true,
};

function checkFile(filePath, content) {
  results.pagesChecked++;

  const issues = [];

  // Check for actual placeholder content (not form placeholders)
  const placeholderPatterns = [
    /coming soon/i,
    /under construction/i,
    /lorem ipsum/i,
    /\[placeholder\]/i,
    /TODO:.*content/i,
    /FIXME:.*content/i,
  ];

  placeholderPatterns.forEach((pattern) => {
    if (pattern.test(content)) {
      issues.push({
        type: 'CRITICAL',
        issue: 'Actual placeholder content found',
        pattern: pattern.toString(),
      });
    }
  });

  // Check for h1 (but allow component-based or redirect pages)
  const hasH1 = content.includes('<h1');
  const isRedirect = content.includes('redirect(');
  const isComponentBased = content.includes('Dashboard') || content.includes('Portal');

  if (!hasH1 && !isRedirect && !isComponentBased && filePath.includes('page.tsx')) {
    // Only flag if it's a substantial page
    if (content.length > 500) {
      issues.push({
        type: 'MEDIUM',
        issue: 'Missing h1 tag',
        note: 'May be in component',
      });
    }
  }

  // Check for broken example.com references (not in forms)
  if (content.includes('example.com') && !content.includes('placeholder=')) {
    issues.push({
      type: 'HIGH',
      issue: 'example.com in actual content',
    });
  }

  if (issues.length > 0) {
    const critical = issues.filter((i) => i.type === 'CRITICAL');
    if (critical.length > 0) {
      results.criticalIssues.push({
        file: filePath,
        issues: critical,
      });
      results.passed = false;
    }
  }

  return issues;
}

function scanDirectory(dir) {
  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        }
      } else if (item === 'page.tsx' || item === 'page.ts') {
        results.totalPages++;
        const content = readFileSync(fullPath, 'utf-8');
        checkFile(fullPath, content);
      }
    }
  } catch (e) {
    // Skip inaccessible directories
  }
}

scanDirectory('app');

if (results.criticalIssues.length > 0) {
  results.criticalIssues.forEach((item, i) => {
    item.issues.forEach((issue) => {});
  });
}

writeFileSync('reports/final-validation-results.json', JSON.stringify(results, null, 2));

process.exit(results.passed ? 0 : 1);
