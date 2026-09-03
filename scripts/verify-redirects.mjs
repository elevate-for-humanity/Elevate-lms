#!/usr/bin/env node

// Usage:
//   node scripts/verify-redirects.mjs --base=http://localhost:8080
//   node scripts/verify-redirects.mjs --base=https://www.elevateforhumanity.org

import fs from 'fs';
import http from 'http';
import https from 'https';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const BASE = (args.base || 'http://localhost:8000').replace(/\/$/, '');


// Read redirects CSV
let csv;
try {
  csv = fs
    .readFileSync('redirects.csv', 'utf8')
    .trim()
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split(',').map((s) => s.trim()));
} catch (error) {
  console.error('❌ Could not read redirects.csv');
  process.exit(1);
}

const fetchHead = (url) =>
  new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(
      url,
      {
        method: 'HEAD',
        timeout: 5000,
        headers: {
          'User-Agent': 'ElevateForHumanity-RedirectChecker/1.0',
        },
      },
      (res) => {
        // We want to see the 301/308 and Location
        resolve({ statusCode: res.statusCode, headers: res.headers });
        res.resume();
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });

const fetchFollow = (url) =>
  new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(
      url,
      {
        method: 'HEAD',
        timeout: 5000,
        headers: {
          'User-Agent': 'ElevateForHumanity-RedirectChecker/1.0',
        },
      },
      (res) => {
        resolve({ statusCode: res.statusCode, headers: res.headers });
        res.resume();
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });

let pass = 0,
  fail = 0;

const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);

for (const [from, to] of csv) {
  const src = BASE + from;
  const expected = new URL(to, BASE).toString();

  try {
    const r = await fetchHead(src);
    const loc = r.headers.location
      ? new URL(r.headers.location, BASE).toString()
      : '';
    const isRedirect = [301, 302, 307, 308].includes(r.statusCode);
    const matches = isRedirect && loc === expected;

    // Optionally follow once to ensure the target returns 200
    let final200 = false;
    if (matches) {
      try {
        const f = await fetchFollow(loc);
        final200 = f.statusCode >= 200 && f.statusCode < 400;
      } catch (followError) {
        final200 = false;
      }
    }

    if (matches && final200) {
      pass++;
    } else if (matches && !final200) {
      fail++;
        `⚠️  ${pad(from, 50)} → ${to}  [${r.statusCode} → target error]`
      );
    } else if (isRedirect && !matches) {
      fail++;
        `❌ ${pad(from, 50)} → ${to}  [${r.statusCode} → "${r.headers.location || ''}"]`
      );
    } else {
      fail++;
        `❌ ${pad(from, 50)} → ${to}  [got ${r.statusCode}, expected redirect]`
      );
    }
  } catch (e) {
    fail++;
  }

  // Small delay to be nice to the server
  await new Promise((resolve) => setTimeout(resolve, 100));
}


if (fail > 0) {
}

process.exit(fail ? 1 : 0);
