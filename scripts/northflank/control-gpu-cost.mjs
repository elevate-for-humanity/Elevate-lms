import {
  authorizedVideoJobIds,
  eligibleAuthorizedVideoJobs,
  generationIsPaused,
} from './lib/gpu-demand.mjs';

const token = process.env.NORTHFLANK_API_TOKEN?.trim();
const team = process.env.NORTHFLANK_TEAM_ID?.trim() || 'elevates-team';
const project = process.env.NORTHFLANK_GPU_PROJECT_ID?.trim() || 'elevate-media-gpu';
const action = process.argv[2] || 'auto';
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const authorizationTtlMinutes = Number(process.env.GPU_AUTHORIZATION_TTL_MINUTES || '90');

if (!token) throw new Error('NORTHFLANK_API_TOKEN is required');
if (!['auto', 'sleep', 'wake-video'].includes(action))
  throw new Error(`Unsupported action: ${action}`);

const base = `https://api.northflank.com/v1/teams/${team}/projects/${project}`;

async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
      'content-type': 'application/json',
      ...init.headers,
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${path}: ${body.slice(0, 800)}`);
  return body ? JSON.parse(body) : {};
}

async function scale(serviceId, instances) {
  let currentRaw;
  try {
    currentRaw = await request(`/services/${serviceId}`);
  } catch (error) {
    // A service that has already been removed is equivalent to zero capacity.
    // Keep wake requests strict so queued video work can never be reported as
    // serviced when the canonical GPU worker is absent.
    if (instances === 0 && String(error).startsWith('Error: 404 ')) {
      console.log(JSON.stringify({ serviceId, instances: 0, changed: false, absent: true }));
      return;
    }
    throw error;
  }
  const current = currentRaw.data ?? currentRaw;
  const existing = Number(
    current.deployment?.instances ?? current.deployment?.spec?.instances ?? 0,
  );
  if (existing === instances) {
    console.log(JSON.stringify({ serviceId, instances, changed: false }));
    return;
  }
  await request(`/services/combined/${serviceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ deployment: { instances } }),
  });
  console.log(JSON.stringify({ serviceId, before: existing, instances, changed: true }));
}

async function eligibleVideoWork() {
  if (!supabaseUrl || !serviceKey)
    throw new Error('Supabase credentials are required for auto mode');
  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}` };
  if (
    !Number.isFinite(authorizationTtlMinutes) ||
    authorizationTtlMinutes < 15 ||
    authorizationTtlMinutes > 180
  ) {
    throw new Error('GPU_AUTHORIZATION_TTL_MINUTES must be between 15 and 180');
  }

  const pauseResponse = await fetch(
    `${supabaseUrl}/rest/v1/system_settings?select=value&key=eq.course_builder_generation_paused&limit=1`,
    { headers },
  );
  if (!pauseResponse.ok) {
    throw new Error(`Unable to inspect Course Builder generation control: ${pauseResponse.status}`);
  }
  const pauseRows = await pauseResponse.json();
  if (generationIsPaused(pauseRows[0]?.value)) return 0;

  const authorizationResponse = await fetch(
    `${supabaseUrl}/rest/v1/paid_inference_requests?select=job_id,operation,status,approved_at,dispatched_at,updated_at&operation=eq.lesson-video&job_id=not.is.null&status=in.(approved,dispatched,acknowledged,processing)&order=updated_at.desc&limit=500`,
    { headers },
  );
  if (!authorizationResponse.ok) {
    throw new Error(
      `Unable to inspect paid inference authorizations: ${authorizationResponse.status}`,
    );
  }
  const authorizations = await authorizationResponse.json();
  const authorizedIds = authorizedVideoJobIds(authorizations, {
    ttlMs: authorizationTtlMinutes * 60 * 1000,
  });
  if (authorizedIds.size === 0) return 0;

  const ids = [...authorizedIds].join(',');
  const jobsResponse = await fetch(
    `${supabaseUrl}/rest/v1/video_jobs?select=id,course_id,status,dead_lettered_at&id=in.(${encodeURIComponent(ids)})&status=in.(queued,rendering)`,
    { headers },
  );
  if (!jobsResponse.ok)
    throw new Error(`Unable to inspect authorized video queue: ${jobsResponse.status}`);
  const jobs = await jobsResponse.json();
  const courseIds = [...new Set(jobs.map((job) => job.course_id).filter(Boolean))];
  if (courseIds.length === 0) return 0;
  const courseResponse = await fetch(
    `${supabaseUrl}/rest/v1/courses?select=id&id=in.(${encodeURIComponent(courseIds.join(','))})&generation_paused=eq.false`,
    { headers },
  );
  if (!courseResponse.ok) {
    throw new Error(`Unable to inspect authorized course state: ${courseResponse.status}`);
  }
  const enabledCourseIds = new Set((await courseResponse.json()).map((course) => course.id));
  return eligibleAuthorizedVideoJobs(jobs, authorizedIds, enabledCourseIds).length;
}

if (action === 'sleep') {
  await scale('elevate-gpu-worker', 0);
} else if (action === 'wake-video') {
  await scale('elevate-gpu-worker', 1);
} else {
  const work = await eligibleVideoWork();
  await scale('elevate-gpu-worker', work > 0 ? 1 : 0);
  console.log(JSON.stringify({ eligibleAuthorizedVideoJobs: work, authorizationTtlMinutes }));
}
