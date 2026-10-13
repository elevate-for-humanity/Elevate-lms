import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const PROJECT = 'elegant-racer-299721';
const REGIONS = ['us-central1', 'us-east1'];
export const PERMISSION_GROUPS = {
  vm: ['compute.instances.create', 'compute.instances.get', 'compute.instances.setMetadata', 'compute.instances.setServiceAccount', 'compute.disks.create', 'compute.disks.use', 'compute.subnetworks.use', 'compute.subnetworks.useExternalIp'],
  routing: ['compute.addresses.create', 'compute.addresses.use', 'compute.firewalls.create', 'compute.healthChecks.create', 'compute.backendServices.create', 'compute.backendServices.update', 'compute.urlMaps.update'],
  monitoring: ['monitoring.timeSeries.list', 'logging.logEntries.list'],
  quota: ['serviceusage.quotas.get', 'serviceusage.quotas.update', 'cloudquotas.quotas.get', 'cloudquotas.quotas.update'],
  billingInspection: ['resourcemanager.projects.get', 'serviceusage.services.get', 'serviceusage.services.use', 'serviceusage.services.enable'],
};

// Billing metadata is read-only. Neither billingEnabled nor open identifies a
// Free Trial/Paid account or a Customer Care subscription in the public API.
export async function inspectProjectBilling(token, request = fetch) {
  const result = {observedAt: new Date().toISOString(), billingEnabled: null,
    linkedAccountSuffix: null, accountOpen: null, currencyCode: null,
    billableStatus: 'UNVERIFIED', supportPlan: 'UNVERIFIED', reads: []};
  async function get(path, operation) {
    try {
      const response = await request('https://cloudbilling.googleapis.com/v1/' + path, {
        method: 'GET', headers: {authorization: 'Bearer ' + token}, signal: AbortSignal.timeout(30000),
      });
      const body = await response.json();
      const errorStatus = body?.error?.status;
      const info = body?.error?.details?.find(x => x['@type'] === 'type.googleapis.com/google.rpc.ErrorInfo');
      result.reads.push({operation, httpStatus: response.status,
        ...(!response.ok ? {errorStatus: /^[A-Z_]{1,60}$/.test(errorStatus || '') ? errorStatus : 'READ_FAILED',
          reason: /^[A-Z_]{1,60}$/.test(info?.reason || '') ? info.reason : undefined,
          service: ['cloudbilling.googleapis.com', 'serviceusage.googleapis.com'].includes(info?.metadata?.service) ? info.metadata.service : undefined,
          permission: [...PERMISSION_GROUPS.billingInspection, 'billing.accounts.get'].includes(info?.metadata?.permission) ? info.metadata.permission : undefined,
          targetProjectConsumer: info?.metadata?.consumer ? ['projects/484736877039', 'projects/' + PROJECT].includes(info.metadata.consumer) : undefined,
        } : {})});
      return response.ok ? body : null;
    } catch {result.reads.push({operation, errorStatus: 'READ_FAILED'}); return null;}
  }
  const project = await get('projects/' + PROJECT + '/billingInfo', 'projectBilling');
  if (typeof project?.billingEnabled === 'boolean') result.billingEnabled = project.billingEnabled;
  const name = project?.billingAccountName;
  if (typeof name === 'string' && /^billingAccounts\/[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}$/.test(name)) {
    // Avoid exposing the full account identifier or account owner in CI logs.
    result.linkedAccountSuffix = name.slice(-6);
    const account = await get(name, 'linkedBillingAccount');
    if (account?.name === name) {
      if (typeof account.open === 'boolean') result.accountOpen = account.open;
      if (/^[A-Z]{3}$/.test(account.currencyCode || '')) result.currencyCode = account.currencyCode;
    }
  }
  return result;
}

// Quota metadata and pending adjustments only; never create preferences or grant access.
export async function inspectRunQuotaOptions(token, request = fetch) {
  const parent = 'https://cloudquotas.googleapis.com/v1/projects/484736877039/locations/global';
  const result = {observedAt: new Date().toISOString(), quotaInfos: [], preferences: [], reads: []};
  for (const [path, key] of [['services/run.googleapis.com/quotaInfos', 'quotaInfos'], ['quotaPreferences', 'preferences']]) {
    let pageToken = '';
    do {
      const endpoint = new URL(parent + '/' + path);
      endpoint.searchParams.set('pageSize', '100');
      if (pageToken) endpoint.searchParams.set('pageToken', pageToken);
      try {
        const response = await request(endpoint, {headers: {authorization: 'Bearer ' + token}, signal: AbortSignal.timeout(30000)});
        const body = await response.json();
        result.reads.push({path, httpStatus: response.status, errorStatus: body.error?.status,
          errorReasons: (body.error?.details || []).map(x => x.reason).filter(Boolean)});
        if (!response.ok) break;
        const entries = key === 'quotaInfos' ? body.quotaInfos : body.quotaPreferences;
        for (const entry of entries || []) {
          if (entry.service !== 'run.googleapis.com' || !/cpu|memory|mem_?alloc/i.test(entry.metric + ' ' + entry.quotaId)) continue;
          if (key === 'quotaInfos') result.quotaInfos.push({quotaId: entry.quotaId, metric: entry.metric,
            dimensions: entry.dimensions, dimensionsInfos: entry.dimensionsInfos,
            isFixed: entry.isFixed, quotaIncreaseEligibility: entry.quotaIncreaseEligibility});
          else result.preferences.push({name: entry.name, quotaId: entry.quotaId,
            dimensions: entry.dimensions, preferredValue: entry.quotaConfig?.preferredValue,
            grantedValue: entry.quotaConfig?.grantedValue, reconciling: entry.reconciling});
        }
        pageToken = body.nextPageToken || '';
      } catch {result.reads.push({path, errorStatus: 'READ_FAILED'}); break;}
    } while (pageToken);
  }
  return result;
}

export function summarizeRevision(revision) {
  const spec = revision.spec || {};
  const container = spec.containers?.[0] || {};
  const env = Object.fromEntries((container.env || []).filter(x => typeof x.value === 'string').map(x => [x.name, x.value]));
  const annotations = revision.metadata?.annotations || {};
  return {
    revision: revision.metadata?.name,
    image: container.image,
    runtimeIdentity: spec.serviceAccountName,
    resources: container.resources?.limits,
    requestConcurrency: spec.containerConcurrency,
    minimumInstances: annotations['autoscaling.knative.dev/minScale'] || '0',
    maximumInstances: annotations['autoscaling.knative.dev/maxScale'] || null,
    continuousCpu: annotations['run.googleapis.com/cpu-throttling'] === 'false',
    videoWorkerDisabled: env.DISABLE_ADMIN_VIDEO_WORKER === 'true',
    adminExecutorConfigured: (env.ELEVATE_SERVICE || env.SERVICE_ROLE) === 'admin',
    studioConfigured: Boolean(env.STUDIO_BROWSER_URL),
  };
}

export async function inspectPermissionBoundary(token, resource, permissions, request = fetch) {
  const endpoint = resource.startsWith('secret:')
    ? `https://secretmanager.googleapis.com/v1/projects/${PROJECT}/secrets/${encodeURIComponent(resource.slice(7))}:testIamPermissions`
    : resource === 'project'
    ? `https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT}:testIamPermissions`
    : `https://iam.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(resource)}:testIamPermissions`;
  try {
    const response = await request(endpoint, {
      method: 'POST', headers: {authorization: `Bearer ${token}`, 'content-type': 'application/json'},
      body: JSON.stringify({permissions}), signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return {checked: false, allowed: false, httpStatus: response.status};
    const body = await response.json();
    const granted = body.permissions ?? [];
    if (!Array.isArray(granted) || granted.some(p => typeof p !== 'string')) return {checked: false, allowed: false, reason: 'invalid_response'};
    const missing = permissions.filter(p => !granted.includes(p));
    return {checked: true, allowed: missing.length === 0, missing};
  } catch {
    return {checked: false, allowed: false, reason: 'request_failed'};
  }
}

function read(args) {
  try {
    return JSON.parse(execFileSync('gcloud', [...args, '--project=' + PROJECT, '--format=json'], {
      encoding: 'utf8', timeout: 60000, maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    }));
  } catch {
    // gcloud errors can include full environment payloads. Never echo them.
    throw new Error('Read failed: ' + args.slice(0, 3).join(' '));
  }
}

export async function runPreflight() {
  let token;
  try {
    token = execFileSync('gcloud', ['auth', 'print-access-token'], {encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe']}).trim();
  } catch {
    throw new Error('Google authentication unavailable; no runtime was changed');
  }
  const report = {observedAt: new Date().toISOString(), project: PROJECT, readOnly: true, permissionChecks: {}, services: [], jobs: [], errors: [], unresolved: [
    'Measure renderer memory and temporary-file peaks with an actual completed MP4.',
    'Prove a dedicated consumer drains both video_jobs and agentic_build_tasks before disabling Admin workers.',
    'Verify Studio runtime access to its existing configuration secret without giving it deployment privileges.',
    'Recover and verify existing encrypted browser state before claiming login-session parity.',
    'Verify worker restart, duplicate-job prevention, public authentication, and rollback before traffic cutover.',
  ]};
  for (const [name, permissions] of Object.entries(PERMISSION_GROUPS)) {
    report.permissionChecks[name] = await inspectPermissionBoundary(token, 'project', permissions);
  }
  report.runQuotaOptions = await inspectRunQuotaOptions(token);
  report.billing = await inspectProjectBilling(token);
  for (const region of REGIONS) {
    try {
      const services = read(['run', 'services', 'list', '--region=' + region]);
      for (const service of services.filter(s => /^elevate-(admin|marketing|lms|store|studio-browser)/.test(s.metadata?.name || ''))) {
        const name = service.metadata.name;
        const live = read(['run', 'services', 'describe', name, '--region=' + region]);
        const entry = {name, region, latestReadyRevision: live.status?.latestReadyRevisionName, traffic: live.status?.traffic || [], servingRevisions: []};
        for (const revisionName of [...new Set(entry.traffic.filter(t => t.percent > 0).map(t => t.revisionName).filter(Boolean))]) {
          entry.servingRevisions.push(summarizeRevision(read(['run', 'revisions', 'describe', revisionName, '--region=' + region])));
        }
        report.services.push(entry);
      }
      const jobs = read(['run', 'jobs', 'list', '--region=' + region]);
      for (const job of jobs.filter(j => /^elevate-(course-builder|video-render)$/.test(j.metadata?.name || ''))) {
        const live = read(['run', 'jobs', 'describe', job.metadata.name, '--region=' + region]);
        const task = live.spec?.template?.spec?.template?.spec || {};
        const executions = read(['run', 'jobs', 'executions', 'list', '--job=' + job.metadata.name, '--region=' + region, '--limit=20']);
        report.jobs.push({name: job.metadata.name, region, image: task.containers?.[0]?.image, resources: task.containers?.[0]?.resources?.limits, runtimeIdentity: task.serviceAccountName, timeoutSeconds: task.timeoutSeconds, maxRetries: task.maxRetries, activeExecutions: executions.filter(x => !x.status?.completionTime && !['True', 'False'].includes(x.status?.conditions?.find(c => c.type === 'Completed')?.status)).map(x => ({name: x.metadata?.name, started: x.status?.startTime, running: x.status?.runningCount}))});
      }
    } catch (error) {report.errors.push({region, operation: error.message});}
  }
  const identities = [...new Set(report.services.flatMap(s => s.servingRevisions.map(r => r.runtimeIdentity)).filter(Boolean))];
  report.runtimeIdentityAttachment = [];
  for (const identity of identities) report.runtimeIdentityAttachment.push({identity, ...await inspectPermissionBoundary(token, identity, ['iam.serviceAccounts.actAs'])});
  const studioIdentity = `elevate-admin-runtime@${PROJECT}.iam.gserviceaccount.com`;
  const studioConfig = 'elevate-studio-browser-runtime-config';
  report.studioSecretPermissions = await inspectPermissionBoundary(token, 'secret:' + studioConfig, ['secretmanager.secrets.getIamPolicy', 'secretmanager.secrets.setIamPolicy']);
  try {
    const policy = read(['secrets', 'get-iam-policy', studioConfig]);
    const projectPolicy = read(['projects', 'get-iam-policy', PROJECT]);
    const member = 'serviceAccount:' + studioIdentity;
    const hasAccessor = p => (p.bindings || []).some(b => b.role === 'roles/secretmanager.secretAccessor' && !b.condition && (b.members || []).includes(member));
    report.studioRuntimeConfig = {secret: studioConfig, runtimeIdentity: studioIdentity, resourceAccessorBinding: hasAccessor(policy), projectAccessorBinding: hasAccessor(projectPolicy), effectiveAccessVerified: false};
  } catch (error) {report.errors.push({operation: error.message});}
  report.renderMetrics = [];
  if (report.permissionChecks.monitoring.allowed) {
    for (const kind of ['memory', 'cpu']) {
      const endpoint = new URL(`https://monitoring.googleapis.com/v3/projects/${PROJECT}/timeSeries`);
      endpoint.searchParams.set('filter', `metric.type="run.googleapis.com/container/${kind}/utilizations" AND resource.type="cloud_run_job" AND resource.labels.job_name="elevate-course-builder"`);
      endpoint.searchParams.set('interval.startTime', new Date(Date.now() - 2 * 3600000).toISOString());
      endpoint.searchParams.set('interval.endTime', new Date().toISOString());
      endpoint.searchParams.set('aggregation.alignmentPeriod', '60s');
      endpoint.searchParams.set('aggregation.perSeriesAligner', 'ALIGN_PERCENTILE_99');
      endpoint.searchParams.set('pageSize', '100');
      try {
        const response = await fetch(endpoint, {headers: {authorization: 'Bearer ' + token}, signal: AbortSignal.timeout(30000)});
        const body = await response.json();
        const values = (body.timeSeries || []).flatMap(s => (s.points || []).map(p => p.value?.doubleValue)).filter(Number.isFinite);
        report.renderMetrics.push({kind, readSucceeded: response.ok, httpStatus: response.status, samples: values.length, maxAlignedP99Utilization: values.length ? Math.max(...values) : null, morePages: Boolean(body.nextPageToken)});
      } catch {report.renderMetrics.push({kind, readSucceeded: false, reason: 'request_failed'});}
    }
  }
  try {
    const region = read(['compute', 'regions', 'describe', 'us-central1']);
    report.computeQuota = (region.quotas || []).filter(q => /CPUS|DISKS_TOTAL_GB|IN_USE_ADDRESSES/.test(q.metric)).map(q => ({metric: q.metric, limit: q.limit, usage: q.usage}));
    report.instances = read(['compute', 'instances', 'list']).filter(x => /admin|studio|browser|render/i.test(x.name)).map(x => ({name: x.name, status: x.status, zone: x.zone?.split('/').pop(), machineType: x.machineType?.split('/').pop(), disks: (x.disks || []).map(d => ({name: d.source?.split('/').pop(), autoDelete: d.autoDelete}))}));
    report.studioDisks = read(['compute', 'disks', 'list', '--filter=name=elevate-studio-browser-auth']).map(x => ({name: x.name, sizeGb: x.sizeGb, status: x.status, zone: x.zone?.split('/').pop()}));
  } catch (error) {report.errors.push({operation: error.message});}
  // Permission checks are evidence, not approval to provision. No secret value,
  // IAM grant, VM, job execution, scaling setting or traffic is changed here.
  report.readyForCutover = false;
  mkdirSync('reports/isolated-workloads', {recursive: true});
  writeFileSync('reports/isolated-workloads/preflight.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await runPreflight();
  if (report.errors.length || Object.values(report.permissionChecks).some(p => !p.checked)) process.exitCode = 1;
}
