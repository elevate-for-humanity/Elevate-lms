#!/usr/bin/env node
import { readFile } from 'fs/promises';

const files = [
  'app/page.tsx',
  'app/globals.css',
  'components/site/SiteFooter.tsx',
  'components/site/SiteHeader.tsx',
  'tailwind.config.js',
];

for (const file of files) {
  try {
    const content = await readFile(file, 'utf-8');
    const blackCount = (content.match(/bg-black|text-black|bg-slate-900/g) || []).length;
    const grayCount = (content.match(/bg-gray|text-gray|bg-slate/g) || []).length;

    if (blackCount > 0 || grayCount > 0) {
    }
  } catch (err) {}
}
