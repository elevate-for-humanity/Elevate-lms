#!/usr/bin/env node
import { globSync } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function fixVoidClosers(html) {
  return html.replace(
    /<\s*(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)([^>]*)\/\s*>/gi,
    (_match, tag, rest) => `<${tag}${rest}>`,
  );
}

function escapeAmpersandsInAttrs(html) {
  return html.replace(/(href|src|action|data-[^=\s]*)\s*=\s*"([^"]*)"/gi, (match, attr, value) => {
    const fixed = value.replace(
      /&(?!amp;|lt;|gt;|quot;|apos;|nbsp;|#\d+;|#x[0-9a-f]+;)/gi,
      '&amp;',
    );
    return `${attr}="${fixed}"`;
  });
}

function escapeAmpersandsInText(html) {
  return html.replace(/&(?!amp;|lt;|gt;|quot;|apos;|nbsp;|#\d+;|#x[0-9a-f]+;)/gi, '&amp;');
}

function addButtonTypes(html) {
  return html.replace(/<button(?![^>]*\btype=)([^>]*)>/gi, (_match, rest) => {
    const trimmed = rest.trim();
    const insertionPoint = trimmed.length ? ` ${trimmed}` : '';
    return `<button type="button"${insertionPoint}>`;
  });
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;

  updated = fixVoidClosers(updated);
  updated = escapeAmpersandsInAttrs(updated);
  updated = escapeAmpersandsInText(updated);
  updated = addButtonTypes(updated);

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
  } else {
  }
}

function gatherTargets(args) {
  if (args.length) {
    return args;
  }
  return ['public/pages/**/*.html', 'public/*.html'];
}

function main() {
  const patterns = gatherTargets(process.argv.slice(2));
  patterns.forEach((pattern) => {
    const files = globSync(pattern, {
      nodir: true,
      strict: false,
      windowsPathsNoEscape: true,
    });
    files.sort().forEach(processFile);
  });
}

main();
