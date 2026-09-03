#!/usr/bin/env node

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PAGES_DIR = 'src/pages';

// Get all page files
const pageFiles = readdirSync(PAGES_DIR)
  .filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'))
  .map((f) => join(PAGES_DIR, f));

// Test patterns
const patterns = {
  buttons: {
    onClick: /<button[^>]*onClick/g,
    onClickArrow: /onClick=\{[^}]*=>/g,
    onClickFunction: /onClick=\{[^}]*\}/g,
  },
  links: {
    reactRouterLink: /<Link[^>]*to=/g,
    htmlLink: /<a[^>]*href=/g,
    navigate: /navigate\(/g,
    useNavigate: /useNavigate\(/g,
  },
  forms: {
    onSubmit: /<form[^>]*onSubmit/g,
    handleSubmit: /handleSubmit/g,
    formData: /FormData/g,
  },
  state: {
    useState: /useState\(/g,
    useEffect: /useEffect\(/g,
    useCallback: /useCallback\(/g,
  },
  api: {
    fetch: /fetch\(/g,
    axios: /axios\./g,
    supabase: /supabase\./g,
  },
};

const results = {
  totalButtons: 0,
  totalLinks: 0,
  totalForms: 0,
  totalStateHooks: 0,
  totalApiCalls: 0,
  pagesWithButtons: [],
  pagesWithLinks: [],
  pagesWithForms: [],
  pagesWithState: [],
  pagesWithApi: [],
  issues: [],
};

// Analyze each page
pageFiles.forEach((filePath) => {
  const fileName = filePath.split('/').pop();
  const content = readFileSync(filePath, 'utf8');

  // Count buttons
  const buttonMatches = content.match(patterns.buttons.onClick) || [];
  if (buttonMatches.length > 0) {
    results.totalButtons += buttonMatches.length;
    results.pagesWithButtons.push({
      file: fileName,
      count: buttonMatches.length,
    });
  }

  // Count links
  const linkMatches = [
    ...(content.match(patterns.links.reactRouterLink) || []),
    ...(content.match(patterns.links.htmlLink) || []),
  ];
  if (linkMatches.length > 0) {
    results.totalLinks += linkMatches.length;
    results.pagesWithLinks.push({ file: fileName, count: linkMatches.length });
  }

  // Count forms
  const formMatches = content.match(patterns.forms.onSubmit) || [];
  if (formMatches.length > 0) {
    results.totalForms += formMatches.length;
    results.pagesWithForms.push({ file: fileName, count: formMatches.length });
  }

  // Count state hooks
  const stateMatches = [
    ...(content.match(patterns.state.useState) || []),
    ...(content.match(patterns.state.useEffect) || []),
  ];
  if (stateMatches.length > 0) {
    results.totalStateHooks += stateMatches.length;
    results.pagesWithState.push({ file: fileName, count: stateMatches.length });
  }

  // Count API calls
  const apiMatches = [
    ...(content.match(patterns.api.fetch) || []),
    ...(content.match(patterns.api.supabase) || []),
  ];
  if (apiMatches.length > 0) {
    results.totalApiCalls += apiMatches.length;
    results.pagesWithApi.push({ file: fileName, count: apiMatches.length });
  }

  // Check for common issues

  // Issue: onClick without handler
  if (content.includes('onClick={}') || content.includes('onClick={() => {}}')) {
    results.issues.push({
      file: fileName,
      type: 'Empty onClick handler',
      severity: 'warning',
    });
  }

  // Issue: Link without to prop
  if (content.includes('<Link>') && !content.includes('<Link to=')) {
    results.issues.push({
      file: fileName,
      type: 'Link without to prop',
      severity: 'error',
    });
  }

  // Issue: Form without onSubmit
  if (content.includes('<form') && !content.includes('onSubmit')) {
    results.issues.push({
      file: fileName,
      type: 'Form without onSubmit handler',
      severity: 'warning',
    });
  }

  // Issue: Async function without error handling
  if (content.includes('async ') && !content.includes('try') && !content.includes('catch')) {
    results.issues.push({
      file: fileName,
      type: 'Async function without error handling',
      severity: 'warning',
    });
  }
});

// Display results

results.pagesWithButtons
  .sort((a, b) => b.count - a.count)
  .slice(0, 10)
  .forEach(({ file, count }) => {});

results.pagesWithLinks
  .sort((a, b) => b.count - a.count)
  .slice(0, 10)
  .forEach(({ file, count }) => {});

results.pagesWithForms.forEach(({ file, count }) => {});

results.pagesWithApi
  .sort((a, b) => b.count - a.count)
  .slice(0, 10)
  .forEach(({ file, count }) => {});

// Display issues
if (results.issues.length > 0) {
  const errors = results.issues.filter((i) => i.severity === 'error');
  const warnings = results.issues.filter((i) => i.severity === 'warning');

  if (errors.length > 0) {
    errors.forEach(({ file, type }) => {});
  }

  if (warnings.length > 0) {
    warnings.forEach(({ file, type }) => {});
  }
} else {
}

// Recommendations
