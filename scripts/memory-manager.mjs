#!/usr/bin/env node
// Read-only diagnostics. These process values describe this CLI, not the web server.
import os from 'node:os';
import v8 from 'node:v8';
import { readFileSync } from 'node:fs';

const obsolete = process.argv.slice(2).filter(arg => ['--cleanup', '--auto-cleanup', '--setup'].includes(arg));
if (obsolete.length) {
  console.error('Automatic deletion and disk-based heap thresholds are retired. No files were changed. Run without cleanup flags for read-only diagnostics.');
  process.exit(2);
}
function readNumber(file) {
  try {
    const raw = readFileSync(file, 'utf8').trim();
    if (raw === 'max') return null;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  } catch { return null; }
}
const current = readNumber('/sys/fs/cgroup/memory.current') ?? readNumber('/sys/fs/cgroup/memory/memory.usage_in_bytes');
const limit = readNumber('/sys/fs/cgroup/memory.max') ?? readNumber('/sys/fs/cgroup/memory/memory.limit_in_bytes');
const ratio = current !== null && limit !== null && limit > 0 ? current / limit : null;
console.log(JSON.stringify({
  scope: 'This diagnostic CLI process; obtain web process heap/RSS from service telemetry.',
  processBytes: process.memoryUsage(),
  heapLimitBytes: v8.getHeapStatistics().heap_size_limit,
  hostBytes: { total: os.totalmem(), free: os.freemem(), scope: 'Host, not necessarily container' },
  containerBytes: { current, limit, utilization: ratio },
}, null, 2));
if (process.argv.includes('--monitor') && ratio !== null && ratio >= 0.9) process.exitCode = 1;
