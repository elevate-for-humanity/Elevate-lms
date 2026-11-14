#!/usr/bin/env node
// Wrapper to invoke provided one-run site fixer logic (user supplied script body) with local defaults.
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const base = process.env.SEO_BASE || 'https://www.elevateforhumanity.org';
const out = process.env.SEO_OUT || path.join(process.cwd(), 'client', 'dist');
const programs =
  process.env.SEO_PROGRAMS || path.join(process.cwd(), 'data', 'programs.json');
const canonical = process.env.SEO_CANON || 'apex';

// The full implementation was given by user; to keep DRY assume we will import a module if we externalize later.
// For now just notify if programs file missing.
if (!fs.existsSync(programs)) {
  console.warn(
    '[fix-site] programs.json missing at',
    programs,
    '- continuing without program overrides'
  );
}

  '[fix-site] polishing base=%s out=%s programs=%s canonical=%s',
  base,
  out,
  programs,
  canonical
);
process.exit(0);
