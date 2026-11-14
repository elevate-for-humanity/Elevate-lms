#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const logDir = path.join(process.cwd(), 'logs');
const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '7', 10);
const today = new Date().toISOString().slice(0, 10);

if (!fs.existsSync(logDir)) {
  process.exit(0);
}

function ageDays(f) {
  const stat = fs.statSync(f);
  return (Date.now() - stat.mtimeMs) / 86400000;
}

for (const f of fs.readdirSync(logDir)) {
  if (!/^app-\d{4}-\d{2}-\d{2}\.log(\.gz)?$/.test(f)) continue;
  if (f.includes(today)) continue; // skip today
  const full = path.join(logDir, f);
  if (f.endsWith('.gz')) {
    if (ageDays(full) > retentionDays) {
      fs.unlinkSync(full);
    }
    continue;
  }
  try {
    const gz = full + '.gz';
    const buf = fs.readFileSync(full);
    fs.writeFileSync(gz, zlib.gzipSync(buf));
    fs.unlinkSync(full);
  } catch (e) {}
}
