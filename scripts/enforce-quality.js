#!/usr/bin/env node

/**
 * Quality Enforcement Script
 *
 * Fails CI if forbidden content patterns are detected.
 * Run this in pre-commit hooks and CI pipelines.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FORBIDDEN_PHRASES = [
  'coming soon',
  'placeholder',
  'lorem ipsum',
  'tbd',
  'todo:',
  'under development',
  'will be available',
  'planned feature',
];

const VAGUE_CTAS = ['learn more', 'get started', 'click here', 'read more'];

const GENERIC_TITLES = [
  'empowering',
  'supporting your journey',
  'helping you succeed',
  'innovative solutions',
];

let errors = 0;


// Check for forbidden phrases
FORBIDDEN_PHRASES.forEach((phrase) => {
  try {
    const result = execSync(
      `grep -ri "${phrase}" app --include="*.tsx" --include="*.ts" || true`,
      { encoding: 'utf-8' }
    );
    if (result.trim()) {
      errors++;
    }
  } catch (e) {
    // grep returns non-zero if no matches, which is what we want
  }
});

// Check for vague CTAs
VAGUE_CTAS.forEach((cta) => {
  try {
    const result = execSync(
      `grep -ri "${cta}" app --include="*.tsx" | grep -E "button|link|href" || true`,
      { encoding: 'utf-8' }
    );
    if (result.trim()) {
      errors++;
    }
  } catch (e) {}
});

// Check for generic titles
GENERIC_TITLES.forEach((title) => {
  try {
    const result = execSync(
      `grep -ri "${title}" app --include="*.tsx" | grep -E "title|h1|heading" || true`,
      { encoding: 'utf-8' }
    );
    if (result.trim()) {
      errors++;
    }
  } catch (e) {}
});

// Check for gradient overlays
try {
  const result = execSync(
    `grep -r "from-.*-900/90\\|bg-gradient-to" app --include="*.tsx" | wc -l`,
    { encoding: 'utf-8' }
  );
  const count = parseInt(result.trim());
  if (count > 0) {
    errors++;
  }
} catch (e) {}

// Check for missing alt text
try {
  const result = execSync(
    `grep -r "<Image\\|<img" app --include="*.tsx" | grep -v "alt=" | wc -l`,
    { encoding: 'utf-8' }
  );
  const count = parseInt(result.trim());
  if (count > 50) {
      `   ⚠️  Warning: ${count} images potentially missing alt text`
    );
  }
} catch (e) {}

// Summary
if (errors > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
