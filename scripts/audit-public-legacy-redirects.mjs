import fs from 'node:fs';
import path from 'node:path';
import config from '../apps/marketing/next.config.mjs';

const root = path.resolve('apps/marketing/app');
const pages = new Map();
const redirects = new Map();
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('@')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'page.tsx') {
      const segments = path.relative(root, dir).split(path.sep).filter(s => s && !s.startsWith('('));
      const route = '/' + segments.join('/');
      pages.set(route, full);
      const source = fs.readFileSync(full, 'utf8');
      if (!/return\s*\(?\s*</.test(source)) {
        const match = source.match(/\b(?:redirect|permanentRedirect)\(['"]([^'"]+)['"]\)/);
        if (match) redirects.set(route, match[1]);
      }
    }
  }
}
walk(root);
for (const rule of await config.redirects()) {
  if (!rule.source.includes(':') && !rule.has) redirects.set(rule.source, rule.destination);
}
function routeExists(destination) {
  if (pages.has(destination)) return true;
  return [...pages.keys()].some(route => {
    const pattern = route.split('/').map(segment => {
      if (segment.startsWith('[[...')) return '(?:/.*)?';
      if (segment.startsWith('[...')) return '/.+';
      if (segment.startsWith('[')) return '/[^/]+';
      return segment ? '/' + segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
    }).join('');
    return new RegExp('^' + (pattern || '/') + '$').test(destination);
  });
}
const failures = [];
for (const [source, target] of redirects) {
  const chain = [source];
  let final = target.split(/[?#]/)[0];
  while (redirects.has(final) && !chain.includes(final)) {
    chain.push(final);
    final = redirects.get(final).split(/[?#]/)[0];
  }
  if (chain.includes(final)) failures.push(`Loop: ${chain.join(' → ')} → ${final}`);
  else if (chain.length > 1) failures.push(`Chain: ${chain.join(' → ')} → ${final}`);
  if (final.startsWith('/') && !routeExists(final)) failures.push(`Missing destination: ${source} → ${final}`);
}
console.log(`Audited ${pages.size} public page routes and ${redirects.size} static redirects.`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log('No static redirect loops, chains, or missing destinations.');
