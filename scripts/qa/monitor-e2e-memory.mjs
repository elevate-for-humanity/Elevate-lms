// Bounded, read-only CI memory sampling. Never records command-line arguments,
// environment values, request URLs, credentials or learner information.
import { readFileSync, readdirSync, readlinkSync } from 'node:fs';

function read(path) {
  try { return readFileSync(path, 'utf8').trim(); } catch { return null; }
}
function numberFile(path) {
  const value = read(path);
  return value && /^\\d+$/.test(value) ? Number(value) : null;
}
function service(cwd, comm) {
  if (cwd?.includes('/apps/marketing')) return 'marketing';
  if (cwd?.includes('/apps/admin')) return 'admin';
  if (cwd?.includes('/apps/lms')) return 'lms';
  if (cwd?.includes('/services/studio-browser')) return 'studio-browser';
  if (/chrom(e|ium)|headless_shell/i.test(comm ?? '')) return 'chromium';
  return null;
}
function snapshot() {
  const processes = [];
  for (const pid of readdirSync('/proc').filter((name) => /^\\d+$/.test(name))) {
    const status = read(`/proc/${pid}/status`);
    if (!status) continue;
    let cwd = null;
    try { cwd = readlinkSync(`/proc/${pid}/cwd`); } catch { /* process may exit */ }
    const comm = read(`/proc/${pid}/comm`);
    const app = service(cwd, comm);
    if (!app) continue;
    const rssKiB = Number(status.match(/^VmRSS:\\s+(\\d+) kB/m)?.[1] ?? 0);
    const vmSizeKiB = Number(status.match(/^VmSize:\\s+(\\d+) kB/m)?.[1] ?? 0);
    processes.push({ app, pid: Number(pid), rssKiB, vmSizeKiB });
  }
  const events = read('/sys/fs/cgroup/memory.events');
  const memoryEvents = Object.fromEntries((events ?? '').split('\\n').filter(Boolean)
    .map((line) => line.split(/\\s+/)).filter((parts) => parts.length === 2)
    .map(([key, value]) => [key, Number(value)]));
  return { at: new Date().toISOString(),
    cgroup: { currentBytes: numberFile('/sys/fs/cgroup/memory.current'),
      maxBytes: numberFile('/sys/fs/cgroup/memory.max'), events: memoryEvents },
    processes };
}
function emit() {
  try { process.stdout.write(JSON.stringify(snapshot()) + '\\n'); }
  catch (error) { process.stderr.write('[e2e-memory] sampling failed: ' + error.code + '\\n'); }
}
emit();
const timer = setInterval(emit, 10000);
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  clearInterval(timer); emit(); process.exit(0);
});
