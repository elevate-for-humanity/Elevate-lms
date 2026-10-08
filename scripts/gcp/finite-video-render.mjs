import { spawn, execFileSync } from 'node:child_process';

export function completedRenderEvidence(job) {
  if (job.status !== 'complete' || !job.video_url || !job.completed_at) return false;
  const e = job.quality_evidence;
  return Boolean(e && /^media-quality-v\d+$/.test(e.gateVersion || '') &&
    e.videoStreams > 0 && e.audioStreams > 0 && e.bytes >= 100000 &&
    e.actualDurationSeconds > 0 && e.captionUrl && e.transcriptUrl);
}

export async function runFiniteVideoRender() {
  const courseId = process.env.VIDEO_COURSE_ID;
  const jobId = process.env.VIDEO_JOB_ID;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(courseId || '') || !uuid.test(jobId || '')) throw new Error('Exact render identities required');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.CRON_SECRET;
  if (!url || !key || !secret) throw new Error('Render runtime credentials required');
  const port = '3100';
  const server = spawn(process.execPath, ['apps/admin/server.js'], {
    env: { ...process.env, PORT: port, DISABLE_ADMIN_VIDEO_WORKER: 'true' },
    stdio: 'inherit',
  });
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const deadline = Date.now() + 55 * 60 * 1000;
  async function readJob() {
    const endpoint = new URL('/rest/v1/video_jobs', url);
    endpoint.searchParams.set('id', 'eq.' + jobId);
    endpoint.searchParams.set('course_id', 'eq.' + courseId);
    endpoint.searchParams.set('select', 'id,status,video_url,completed_at,quality_evidence');
    const response = await fetch(endpoint, { headers: { apikey: key, authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('Unable to inspect exact render state: HTTP ' + response.status);
    const rows = await response.json();
    if (rows.length !== 1) throw new Error('Exact render job not found');
    return rows[0];
  }
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (server.exitCode !== null) throw new Error('Packaged renderer exited before acceptance');
      try { const r = await fetch('http://127.0.0.1:' + port + '/api/ping', { signal: AbortSignal.timeout(2000) }); ready = r.ok; } catch {}
      if (ready) break;
      await pause(1000);
    }
    if (!ready) throw new Error('Packaged renderer did not start');
    let claimed = false;
    while (Date.now() < deadline) {
      if (server.exitCode !== null) throw new Error('Renderer process exited during execution');
      const job = await readJob();
      if (job.status === 'failed') throw new Error('Exact render failed; no automatic retry');
      if (job.status === 'complete') {
        if (!completedRenderEvidence(job)) throw new Error('Completed render lacks canonical media evidence');
        const media = await fetch(job.video_url, { headers: { Range: 'bytes=0-1023' }, signal: AbortSignal.timeout(30000) });
        if (![200, 206].includes(media.status)) throw new Error('Completed render is not reachable');
        await media.body?.cancel();
        const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height', '-of', 'json', job.video_url], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'] }));
        if (!probe.streams.some(s => s.codec_type === 'video') || !probe.streams.some(s => s.codec_type === 'audio')) throw new Error('Completed media is not an audiovisual video');
        // Let the server finish its canonical course finalization after the
        // durable terminal media write. Incomplete courses cannot be published.
        await pause(30000);
        console.log(JSON.stringify({ verified: true, courseId, jobId, completedAt: job.completed_at, gateVersion: job.quality_evidence.gateVersion, codecs: probe.streams.map(s => s.codec_name) }));
        return;
      }
      if (!claimed && job.status === 'queued') {
        const r = await fetch('http://127.0.0.1:' + port + '/api/internal/videos/process-queue', {
          method: 'POST', headers: { authorization: 'Bearer ' + secret, 'content-type': 'application/json' },
          body: JSON.stringify({ courseId, jobId, queueOneDraft: true, maxJobs: 1 }), signal: AbortSignal.timeout(60000),
        });
        if (!r.ok) throw new Error('Renderer execution rejected: HTTP ' + r.status);
        const result = await r.json();
        claimed = result.started === 1;
        if (claimed) console.log(JSON.stringify({ started: true, courseId, jobId }));
      }
      await pause(10000);
    }
    throw new Error('Finite render exceeded its execution deadline');
  } finally { server.kill('SIGTERM'); }
}
