// Read only Cloud Monitoring's most recent distribution samples for the actual
// serving revisions. Configured CPU/memory limits are never treated as usage.
const metrics = {
  cpu: 'run.googleapis.com/container/cpu/utilizations',
  memory: 'run.googleapis.com/container/memory/utilizations',
  instances: 'run.googleapis.com/container/instance_count',
};
export async function readApplicationUsage({read, applications, observedAt}) {
  const end = Date.parse(observedAt);
  if (!Number.isFinite(end)) throw Error('usage_observation_time_invalid');
  const start = end - 15 * 60_000;
  const samples = new Map();
  const failures = [];
  for (const [kind, type] of Object.entries(metrics)) {
    let pageToken = '';
    let pages = 0;
    try {
      do {
        const url = new URL('https://monitoring.googleapis.com/v3/projects/elegant-racer-299721/timeSeries');
        url.searchParams.set('filter', `metric.type = "${type}" AND resource.type = "cloud_run_revision"`);
        url.searchParams.set('interval.startTime', new Date(start).toISOString());
        url.searchParams.set('interval.endTime', new Date(end).toISOString());
        url.searchParams.set('view', 'FULL');
        url.searchParams.set('pageSize', '1000');
        if (pageToken) url.searchParams.set('pageToken', pageToken);
        const body = await read(url.toString());
        if (!Array.isArray(body.timeSeries) && body.timeSeries !== undefined) throw Error('invalid_usage_response');
        for (const series of body.timeSeries || []) {
          if (series.metric?.type !== type || series.resource?.type !== 'cloud_run_revision') continue;
          const labels = series.resource.labels || {};
          if (labels.project_id !== 'elegant-racer-299721') continue;
          const app = applications.find(app => app.kind === 'service' && app.name === labels.service_name && app.region === labels.location && app.serving.some(row => row.revision === labels.revision_name));
          if (!app) continue;
          const state = kind === 'instances' ? series.metric.labels?.state : kind;
          if (!['cpu', 'memory', 'active', 'idle'].includes(state)) continue;
          const key = [app.region, app.name, labels.revision_name, state].join('/');
          for (const point of series.points || []) {
            const timestamp = Date.parse(point.interval?.endTime);
            const distribution = point.value?.distributionValue;
            const raw = kind === 'instances' ? point.value?.int64Value : Number(distribution?.count) > 0 ? (distribution.mean ?? 0) : undefined;
            if (raw === undefined || raw === null || raw === '') continue;
            const value = Number(raw);
            if (!Number.isFinite(timestamp) || timestamp < start || timestamp > end || !Number.isFinite(value) || value < 0 || (kind === 'instances' && !Number.isSafeInteger(value))) continue;
            if (!samples.has(key) || timestamp > samples.get(key).timestamp) samples.set(key, {value, timestamp});
          }
        }
        pageToken = body.nextPageToken || '';
        if (++pages >= 2 && pageToken) throw Error('usage_inventory_truncated');
      } while (pageToken);
    } catch (error) {
      failures.push({scope:'monitoring/'+kind,code:error.message === 'permission_denied'?'permission_denied':'usage_not_verified'});
      // A partial metric inventory must not appear complete.
      for (const key of samples.keys()) if (key.endsWith('/'+kind) || (kind === 'instances' && /\/(active|idle)$/.test(key))) samples.delete(key);
    }
  }
  const measured = applications.map(app => {
    const revisions = app.kind !== 'service' ? [] : app.serving.map(row => {
      const prefix = [app.region, app.name, row.revision].join('/') + '/';
      const sample = kind => {
        const data = samples.get(prefix+kind);
        return data ? {value:['cpu','memory'].includes(kind)?data.value*100:data.value,sampledAt:new Date(data.timestamp).toISOString()} : null;
      };
      return {revision:row.revision,cpuPercent:sample('cpu'),memoryPercent:sample('memory'),activeInstances:sample('active'),idleInstances:sample('idle')};
    });
    const hasSamples = revisions.some(row => row.cpuPercent || row.memoryPercent || row.activeInstances || row.idleInstances);
    return {...app,observedUsage:hasSamples?{windowStart:new Date(start).toISOString(),windowEnd:new Date(end).toISOString(),revisions}:null};
  });
  return {applications:measured,failures};
}
