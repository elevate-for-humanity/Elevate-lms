import { promises as fs } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...r] = a.replace(/^--/, '').split('=');
    return [k, r.join('=') || true];
  }),
);
const SRC = args.src || 'src',
  OUT = args.out || 'scripts/routes.json',
  BASE = (args.base || '/').replace(/\/+$/, '') || '',
  INCLUDE_DYNAMIC = !!args.includeDynamic;
const exts = ['js', 'jsx', 'ts', 'tsx'];
const norm = (p) => {
  if (!p) return null;
  if (/^[a-z]+:\/\//i.test(p)) return null;
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.replace(/\/{2,}/g, '/');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return BASE && BASE !== '/' ? (BASE + p).replace(/\/{2,}/g, '/') : p;
};
const looksDynamic = (p) => /(^|\/)(:|\\\*|\*|\(|\[)/.test(p);
const extract = (src) => {
  const set = new Set();
  let m;
  const r1 = /<Route\s+[^>]*\bpath\s*=\s*{?\s*["'`]([^"'`]+)["'`]\s*}?[^>]*>/gi;
  while ((m = r1.exec(src))) set.add(m[1]);
  if (/<Route\s+[^>]*\bindex\b[^>]*>/i.test(src)) set.add('/');
  const r2 = /\bpath\s*:\s*["'`]([^"'`]+)["'`]/gi;
  while ((m = r2.exec(src))) set.add(m[1]);
  return [...set];
};
const files = await glob(path.join(SRC, `**/*.{${exts.join(',')}}`));
let paths = [];
for (const f of files) {
  const code = await fs.readFile(f, 'utf8').catch(() => null);
  if (!code) continue;
  paths.push(...extract(code));
}
paths = [...new Set(paths)]
  .map(norm)
  .filter(Boolean)
  .filter((p) => INCLUDE_DYNAMIC || !looksDynamic(p));
if (!paths.includes('/')) paths.unshift('/');
paths.sort((a, b) => a.length - b.length || a.localeCompare(b));
await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, JSON.stringify(paths, null, 2));
