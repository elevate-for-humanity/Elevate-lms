import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const revision = process.env.FAILED_REVISION;
if (!/^elevate-marketing-migration-[a-z0-9-]+$/.test(revision || '')) throw new Error('Missing exact attempted revision');
const project = 'elegant-racer-299721';
const report = { revision, metadata: null, logs: [], errors: [] };
function redact(value) {
  return String(value).replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED JWT]')
    .replace(/((?:api[_-]?key|token|password|secret)\s*[:=]\s*)\S+/gi, '$1[REDACTED]');
}
function read(args) {
  return JSON.parse(execFileSync('gcloud', [...args, '--project=' + project, '--format=json'], {
    encoding: 'utf8', timeout: 20000, maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  }));
}
try {
  const data = read(['run', 'revisions', 'describe', revision, '--region=us-central1']);
  const container = data.spec?.containers?.[0] || {};
  report.metadata = {
    image: container.image, commandExecutable: container.command?.[0], argumentCount: container.args?.length || 0,
    ports: container.ports, startupProbe: container.startupProbe, resources: container.resources,
    conditions: (data.status?.conditions || []).map(c => ({ type: c.type, status: c.status, reason: c.reason, message: redact(c.message || '') })),
  };
} catch (error) { report.errors.push({ operation: 'revision_metadata', code: error.code, message: redact(error.stderr || error.message).slice(0, 1000) }); }
// Logs can arrive after the revision failure. Three bounded reads allow ingestion
// delay without hanging the failed release or replacing its original verdict.
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const rows = read(['logging', 'read', `resource.type="cloud_run_revision" AND resource.labels.service_name="elevate-marketing-migration" AND resource.labels.revision_name="${revision}"`, '--freshness=2h', '--limit=100', '--order=asc']);
    report.logs = rows.map(row => ({ timestamp: row.timestamp, severity: row.severity,
      message: redact(row.textPayload || row.jsonPayload?.message || row.jsonPayload?.text || row.protoPayload?.status?.message || '').slice(0, 2000) }));
    if (rows.length) break;
  } catch (error) {
    report.errors.push({ operation: 'revision_logs', attempt, code: error.code, message: redact(error.stderr || error.message).slice(0, 1000) });
    if (/PERMISSION_DENIED|permission.*denied/i.test(String(error.stderr))) break;
  }
  if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 10000));
}
mkdirSync('deployment-diagnostics', { recursive: true });
writeFileSync('deployment-diagnostics/marketing-revision.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
if (!report.metadata || !report.logs.length) {
  console.error('Revision diagnostics incomplete: inspect recorded metadata/log access errors.');
  process.exitCode = 1;
}
