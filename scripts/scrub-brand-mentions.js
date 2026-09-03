// Scrub or replace brand mentions across HTML and JS bundles
const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');

const TARGETS = [/\bWork\s?One\b/gi];

const REPLACEMENT = process.env.WORKONE_REPLACEMENT || 'local workforce center';

function scrubInFile(file) {
  try {
    const src = fs.readFileSync(file, 'utf8');
    let out = src;
    TARGETS.forEach((re) => {
      out = out.replace(re, REPLACEMENT);
    });
    if (out !== src) {
      fs.writeFileSync(file, out);
    }
  } catch (e) {}
}

(async function main() {
  const files = await fg([
    '**/*.html',
    '**/*.js',
    '!**/node_modules/**',
    '!**/server/**',
    '!**/app/assets/**',
  ]);
  files.forEach(scrubInFile);
})();
