#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
if (!/^https?:\/\//i.test(SITE_URL)) {
  console.error('Invalid SITE_URL. Must start with http:// or https://');
  process.exit(254);
}
if (
  /^https?:\/\/\s*$/i.test(SITE_URL) ||
  /https?:\/\/\(your|www)\.[^\s]+/i.test(SITE_URL) ||
  /https?:\/\/www\.example\.com/i.test(SITE_URL)
) {
  console.error(
    'Invalid SITE_URL. Replace placeholder with your real domain (e.g., https://your-domain.com).',
  );
  process.exit(254);
}
const CONCURRENCY = Number(process.env.VERIFY_CONCURRENCY || 8);
const TIMEOUT_MS = Number(process.env.VERIFY_TIMEOUT_MS || 8000);
const RETRIES = Number(process.env.VERIFY_RETRIES || 1);

/** Find .html files in dist and return URL paths */
async function collectPaths(distDir) {
  const entries = [];
  async function walk(dir) {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const it of items) {
      const full = path.join(dir, it.name);
      if (it.isDirectory()) await walk(full);
      else if (it.isFile() && it.name.endsWith('.html')) entries.push(full);
    }
  }
  await walk(distDir);
  const paths = new Set();
  for (const file of entries) {
    const rel = path.relative(distDir, file).replace(/\\/g, '/');
    if (rel === 'index.html') paths.add('/');
    else if (rel.endsWith('/index.html')) paths.add('/' + rel.slice(0, -'index.html'.length));
    else paths.add('/' + rel);
  }
  // always include robots and sitemap if present
  try {
    await fs.access(path.join(distDir, 'robots.txt'));
    paths.add('/robots.txt');
  } catch {}
  try {
    await fs.access(path.join(distDir, 'sitemap.xml'));
    paths.add('/sitemap.xml');
  } catch {}
  return Array.from(paths);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function checkUrl(url) {
  let lastErr;
  for (let i = 0; i <= RETRIES; i++) {
    try {
      const res = await fetchWithTimeout(url, { method: 'HEAD' });
      if (res.ok) return { url, ok: true, status: res.status };
      // some hosts may not allow HEAD; fallback to GET
      const resGet = await fetchWithTimeout(url);
      return { url, ok: resGet.ok, status: resGet.status };
    } catch (e) {
      lastErr = e;
      await delay(200);
    }
  }
  return { url, ok: false, error: lastErr?.message || String(lastErr) };
}

async function pool(tasks, size) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: size }, async () => {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const distDir = path.resolve('dist');
  const paths = await collectPaths(distDir);
  if (paths.length === 0) {
    console.error('No paths found in dist; did you run a production build (npm run build)?');
    process.exit(1);
  }
  const urls = paths.map((p) => new URL(p, SITE_URL).toString());
  const tasks = urls.map((u) => () => checkUrl(u));
  const results = await pool(tasks, CONCURRENCY);
  const failures = results.filter((r) => !r.ok);
  for (const r of results) {
    const status = r.ok ? r.status : r.error || r.status;
  }
  if (failures.length) {
    console.error(`\n${failures.length} failing URLs`);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
