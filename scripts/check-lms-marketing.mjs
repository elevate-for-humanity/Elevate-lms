#!/usr/bin/env node
import { readdir, readFile, access } from 'fs/promises';
import { join } from 'path';

// Check LMS pages

const lmsPages = [
  'app/lms/(app)/dashboard/page.tsx',
  'app/lms/(app)/courses/page.tsx',
  'app/lms/(app)/analytics/page.tsx',
  'app/lms/(app)/social/page.tsx',
  'app/lms/(app)/collaborate/page.tsx',
  'app/lms/(app)/builder/page.tsx',
  'app/lms/(app)/integrations/page.tsx',
];

let lmsComplete = 0;
const lmsTotal = lmsPages.length;

for (const page of lmsPages) {
  try {
    const content = await readFile(page, 'utf-8');
    const lines = content.split('\n').length;
    const hasMetadata =
      content.includes('export const metadata') || content.includes('generateMetadata');
    const hasExport = content.includes('export default');

    const status = hasExport && lines > 20 ? '✅' : '⚠️';
    const metaStatus = hasMetadata ? '✅' : '❌';

    if (hasExport && lines > 20) lmsComplete++;

    const pageName = page.split('/').pop().replace('.tsx', '');
  } catch (err) {}
}

// Check marketing pages

const marketingPages = [
  { path: 'app/page.tsx', name: 'Homepage' },
  { path: 'app/about/page.tsx', name: 'About' },
  { path: 'app/programs/page.tsx', name: 'Programs' },
  { path: 'app/employers/page.tsx', name: 'Employers' },
  { path: 'app/apprenticeships/page.tsx', name: 'Apprenticeships' },
  { path: 'app/apply/page.tsx', name: 'Apply' },
  { path: 'app/contact/page.tsx', name: 'Contact' },
  { path: 'app/vita/page.tsx', name: 'VITA (Free Tax)' },

];

let marketingComplete = 0;
const marketingTotal = marketingPages.length;

for (const { path, name } of marketingPages) {
  try {
    const content = await readFile(path, 'utf-8');
    const lines = content.split('\n').length;
    const hasMetadata =
      content.includes('export const metadata') || content.includes('generateMetadata');
    const hasExport = content.includes('export default');

    const status = hasExport && lines > 20 ? '✅' : '⚠️';
    const metaStatus = hasMetadata ? '✅' : '❌';

    if (hasExport && lines > 20) marketingComplete++;
  } catch (err) {}
}

// Check for missing features

const features = [
  { name: 'LMS Dashboard', path: 'app/lms/(app)/dashboard/page.tsx', category: 'LMS' },
  { name: 'Course Catalog', path: 'app/lms/(app)/courses/page.tsx', category: 'LMS' },
  { name: 'Student Analytics', path: 'app/lms/(app)/analytics/page.tsx', category: 'LMS' },
  { name: 'Social Learning', path: 'app/lms/(app)/social/page.tsx', category: 'LMS' },
  { name: 'Course Builder', path: 'app/lms/(app)/builder/page.tsx', category: 'LMS' },
  { name: 'Blog/News', path: 'app/blog/page.tsx', category: 'Marketing' },
  { name: 'Success Stories', path: 'app/success-stories/page.tsx', category: 'Marketing' },
  { name: 'FAQ', path: 'app/faq/page.tsx', category: 'Marketing' },
  { name: 'Pricing', path: 'app/pricing/page.tsx', category: 'Marketing' },
];

let featuresPresent = 0;
const featuresTotal = features.length;

for (const { name, path, category } of features) {
  try {
    await access(path);
    featuresPresent++;
  } catch (err) {}
}

// Overall assessment

const lmsScore = Math.round((lmsComplete / lmsTotal) * 100);
const marketingScore = Math.round((marketingComplete / marketingTotal) * 100);
const featureScore = Math.round((featuresPresent / featuresTotal) * 100);
const overallScore = Math.round((lmsScore + marketingScore + featureScore) / 3);

// Recommendations

if (lmsScore < 100) {
}

if (marketingScore < 100) {
}

if (featureScore < 100) {
}

process.exit(overallScore >= 90 ? 0 : 1);
