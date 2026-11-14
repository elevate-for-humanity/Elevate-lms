#!/usr/bin/env node
// Fetch readiness and emit condensed report (exit non-zero if below threshold)
const http = require('http');
const threshold = parseInt(process.env.READINESS_MIN || '60', 10);
const host = process.env.READINESS_HOST || 'localhost';
const port = process.env.PORT || 5000;
function fetch(path) {
  return new Promise((resolve, reject) => {
    http
      .get({ host, port, path }, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}
(async () => {
  try {
    const data = await fetch('/api/readiness');
    const overall = data.overall;
    console.log('Readiness Overall:', overall);
    const sorted = [...data.checks].sort((a, b) => a.score - b.score).slice(0, 5);
    console.log('Lowest 5 checks:');
    for (const c of sorted) console.log('-', c.name, c.score, c.detail);
    if (overall < threshold) {
      console.error(`Readiness below threshold (${overall} < ${threshold})`);
      process.exit(2);
    }
  } catch (e) {
    console.error('Failed readiness report', e.message);
    process.exit(1);
  }
})();
