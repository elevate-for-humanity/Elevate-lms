import { pathToFileURL } from 'node:url';
import { google, PROJECT } from './runtime-config.mjs';

// Preserve every source secret group independently of service attachment.
// Credential payloads travel only in memory and through the CLI stdin pipe.
export async function transferGroups({ request = fetch, run = google, env = process.env } = {}) {
  if (!env.NORTHFLANK_API_TOKEN) throw new Error('source_authentication_missing');
  async function get(path) {
    const response = await request('https://api.northflank.com/v1' + path, {
      headers: { Authorization: 'Bearer ' + env.NORTHFLANK_API_TOKEN }, signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error('source_inventory_http_' + response.status);
    const body = await response.json(); return body.data ?? body;
  }
  function rows(body, key) {
    const value = Array.isArray(body) ? body : body[key];
    if (!Array.isArray(value)) throw new Error('source_inventory_incomplete');
    return value;
  }
  function identifier(value) {
    if (typeof value !== 'string' || !/^[a-z0-9-]+$/.test(value)) throw new Error('source_identifier_invalid');
    return value;
  }
  const report = [];
  const projects = rows(await get('/projects'), 'projects');
  if (!projects.length) throw new Error('source_inventory_empty');
  for (const project of projects) {
    const projectId = identifier(project.id);
    const groups = rows(await get('/projects/' + projectId + '/secrets'), 'secrets');
    for (const group of groups) {
      const groupId = identifier(group.id);
      const secret = 'elevate-source-' + projectId + '-' + groupId;
      const entry = { project: projectId, sourceGroup: groupId, googleSecret: secret, verified: false };
      report.push(entry);
      try {
        const details = await get('/projects/' + projectId + '/secrets/' + groupId + '/details');
        if (!details.secrets || !details.secrets.variables || typeof details.secrets.variables !== 'object')
          throw new Error('source_secret_payload_incomplete');
        const payload = JSON.stringify({ version: 1, sourceProject: projectId, sourceGroup: groupId, secrets: details.secrets });
        if (Buffer.byteLength(payload) > 65536) throw new Error('secret_payload_requires_split');
        let exists = true;
        try { run(['secrets','describe',secret,'--project',PROJECT,'--format=value(name)']); }
        catch (error) { if (error.code !== 'not_found') throw error; exists = false; }
        if (!exists) run(['secrets','create',secret,'--project',PROJECT,'--replication-policy=automatic']);
        const versions = run(['secrets','versions','list',secret,'--project',PROJECT,'--limit=1','--format=value(name)']);
        if (versions) {
          if (run(['secrets','versions','access','latest','--secret',secret,'--project',PROJECT]) !== payload)
            throw new Error('existing_google_payload_differs');
        } else {
          const added = JSON.parse(run(['secrets','versions','add',secret,'--project',PROJECT,'--data-file=-','--format=json'],payload));
          const version = added.name?.split('/').at(-1);
          if (!/^\d+$/.test(version ?? '')) throw new Error('written_version_unverified');
          if (run(['secrets','versions','access',version,'--secret',secret,'--project',PROJECT]) !== payload)
            throw new Error('secret_readback_mismatch');
        }
        entry.variableNames = Object.keys(details.secrets.variables).sort();
        entry.verified = true;
      } catch (error) {
        const allowed = ['permission_denied','api_disabled','not_found','authentication_failed','quota_exceeded',
          'source_secret_payload_incomplete','secret_payload_requires_split','existing_google_payload_differs',
          'written_version_unverified','secret_readback_mismatch'];
        const reason = error.code ?? error.message;
        entry.reason = allowed.includes(reason) ? reason : 'transfer_unverified';
      }
    }
  }
  return { groups: report, passed: report.every(row => row.verified), sourceDeleted: false };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  transferGroups().then(report => { console.log(JSON.stringify(report)); if (!report.passed) process.exitCode = 1; })
    .catch(() => { console.error('Complete source secret inventory unavailable; no source resources deleted'); process.exitCode = 1; });
}
