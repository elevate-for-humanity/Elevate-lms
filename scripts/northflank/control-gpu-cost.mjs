const token = process.env.NORTHFLANK_API_TOKEN?.trim();
const team = process.env.NORTHFLANK_TEAM_ID?.trim() || 'elevates-team';
const project = process.env.NORTHFLANK_GPU_PROJECT_ID?.trim() || 'elevate-media-gpu';
const action = process.argv[2] || 'auto';
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!token) throw new Error('NORTHFLANK_API_TOKEN is required');
if (!['auto', 'sleep', 'wake-video'].includes(action)) throw new Error(`Unsupported action: ${action}`);

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
  const currentRaw = await request(`/services/${serviceId}`);
  const current = currentRaw.data ?? currentRaw;
  const existing = Number(current.deployment?.instances ?? current.deployment?.spec?.instances ?? 0);
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
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase credentials are required for auto mode');
  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}` };
  const courseResponse = await fetch(
    `${supabaseUrl}/rest/v1/courses?select=id&generation_paused=eq.false`,
    { headers },
  );
  if (!courseResponse.ok) throw new Error(`Unable to inspect active courses: ${courseResponse.status}`);
  const courses = await courseResponse.json();
  let total = 0;
  for (const course of courses) {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/video_jobs?select=id&course_id=eq.${course.id}&status=in.(queued,rendering)&dead_lettered_at=is.null`,
      { method: 'HEAD', headers: { ...headers, prefer: 'count=exact' } },
    );
    if (!response.ok) throw new Error(`Unable to inspect video queue: ${response.status}`);
    const range = response.headers.get('content-range') || '*/0';
    total += Number(range.split('/')[1] || 0);
  }
  return total;
}

// Course intelligence is serverless Cloudflare Workers AI. Never leave its
// former dedicated L4 running between builds.
await scale('elevate-llm-worker', 0);

if (action === 'sleep') {
  await scale('elevate-gpu-worker', 0);
} else if (action === 'wake-video') {
  await scale('elevate-gpu-worker', 1);
} else {
  const work = await eligibleVideoWork();
  await scale('elevate-gpu-worker', work > 0 ? 1 : 0);
  console.log(JSON.stringify({ eligibleVideoJobs: work }));
}
