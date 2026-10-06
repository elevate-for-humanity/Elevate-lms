import { writeFileSync } from 'node:fs';
import { google, PROJECT } from './runtime-config.mjs';

const report = { project: PROJECT, observedAt: new Date().toISOString(), resources: {}, failures: [] };
function read(name, args, select) {
  try { report.resources[name] = select(JSON.parse(google([...args, '--project', PROJECT, '--format=json']))); }
  catch (error) { report.failures.push({ resource: name, reason: error.code ?? 'inventory_unavailable' }); }
}
read('instances', ['compute', 'instances', 'list'], rows => rows.map(v => ({
  name: v.name, zone: v.zone, status: v.status, machineType: v.machineType,
  disks: (v.disks ?? []).map(d => ({ source: d.source, deviceName: d.deviceName, autoDelete: d.autoDelete, boot: d.boot })),
  identities: (v.serviceAccounts ?? []).map(s => ({ email: s.email, scopes: s.scopes })),
  network: (v.networkInterfaces ?? []).map(n => ({ network: n.network, subnetwork: n.subnetwork, privateIp: n.networkIP, publicIp: (n.accessConfigs ?? []).map(a => a.natIP) })),
  startupMechanism: (v.metadata?.items ?? []).map(m => m.key).filter(k => /startup|container|logging|monitoring/.test(k)),
})));
read('disks', ['compute', 'disks', 'list'], rows => rows.map(d => ({ name: d.name, sizeGb: d.sizeGb, type: d.type, users: d.users, status: d.status, zone: d.zone })));
read('snapshots', ['compute', 'snapshots', 'list'], rows => rows.map(s => ({ name: s.name, sourceDisk: s.sourceDisk, status: s.status, creationTimestamp: s.creationTimestamp })));
read('secretMetadata', ['secrets', 'list'], rows => rows.map(s => ({ name: s.name, createTime: s.createTime, replication: s.replication })));
read('enabledServices', ['services', 'list', '--enabled'], rows => rows.map(s => s.config?.name));
read('deploymentRoles', ['projects', 'get-iam-policy', PROJECT], policy => (policy.bindings ?? []).filter(b => (b.members ?? []).includes(`serviceAccount:elevate-github-deploy@${PROJECT}.iam.gserviceaccount.com`)).map(b => ({ role: b.role, conditional: Boolean(b.condition) })));
read('scheduler', ['scheduler', 'jobs', 'list', '--location=us-central1'], rows => rows.map(j => ({ name: j.name, schedule: j.schedule, state: j.state, target: j.httpTarget?.uri, serviceAccount: j.httpTarget?.oauthToken?.serviceAccountEmail ?? j.httpTarget?.oidcToken?.serviceAccountEmail })));
read('buckets', ['storage', 'buckets', 'list'], rows => rows.map(b => ({ name: b.name, location: b.location, versioning: b.versioning?.enabled, uniformAccess: b.iamConfiguration?.uniformBucketLevelAccess?.enabled })));
read('courseExecutions', ['run', 'jobs', 'executions', 'list', '--job=elevate-course-builder', '--region=us-central1', '--limit=5'], rows => rows.map(e => ({
  name: e.metadata?.name, startedAt: e.status?.startTime, completedAt: e.status?.completionTime,
  running: e.status?.runningCount, succeeded: e.status?.succeededCount, failed: e.status?.failedCount,
  conditions: (e.status?.conditions ?? []).map(c => ({ type: c.type, status: c.status, reason: c.reason })),
})));
writeFileSync('google-ownership-inventory.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ observedAt: report.observedAt, resources: Object.keys(report.resources), failures: report.failures }));
if (report.failures.length) process.exitCode = 1;
