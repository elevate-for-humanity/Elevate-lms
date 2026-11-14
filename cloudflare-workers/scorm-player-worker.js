/**
 * Cloudflare Worker for SCORM Course Delivery
 * Handles SCORM package serving with CORS and proper headers
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }

    // Route handling
    if (url.pathname.startsWith('/scorm/')) {
      return handleSCORM(request, env, url);
    }

    if (url.pathname === '/api/scorm/track') {
      return handleTracking(request, env);
    }

    return new Response('SCORM Worker Active', { status: 200 });
  },
};

/**
 * Handle SCORM file delivery from R2
 */
async function handleSCORM(request, env, url) {
  try {
    // Extract course path: /scorm/jri-badge-1/index.html
    const path = url.pathname.replace('/scorm/', '');

    // Get file from R2
    const object = await env.SCORM_BUCKET.get(path);

    if (!object) {
      return new Response('SCORM file not found', { status: 404 });
    }

    // Determine content type
    const contentType = getContentType(path);

    // Return file with proper headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Cache-Control', 'public, max-age=3600');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('SCORM delivery error:', error);
    return new Response('Error loading SCORM content', { status: 500 });
  }
}

/**
 * Handle SCORM progress tracking
 */
const TRACKING_ORIGINS = new Set([
  'https://www.elevateforhumanity.org',
  'https://app.elevateforhumanity.org',
  'https://lms.elevateforhumanity.org',
  'https://scorm.elevateforhumanity.org',
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function trackingResponse(request, body, status = 200) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  });
  const origin = request.headers.get('Origin');
  if (TRACKING_ORIGINS.has(origin)) headers.set('Access-Control-Allow-Origin', origin);
  return Response.json(body, { status, headers });
}

async function handleTracking(request, env) {
  const respond = (body, status) => trackingResponse(request, body, status);
  const origin = request.headers.get('Origin');
  if (origin && !TRACKING_ORIGINS.has(origin)) return respond({ error: 'ORIGIN_NOT_ALLOWED' }, 403);
  if (request.method !== 'POST') return respond({ error: 'METHOD_NOT_ALLOWED' }, 405);
  const authorization = request.headers.get('Authorization');
  if (!/^Bearer \S+$/i.test(authorization || ''))
    return respond({ error: 'AUTHENTICATION_REQUIRED' }, 401);
  // Use the same project and end-user token as the LMS. Never use a service-role
  // credential or an independent KV progress ledger for learner tracking.
  const project = 'https://cuxzzpsyufcewtmicszk.supabase.co';
  const key = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
  if (!key) return respond({ error: 'TRACKING_CONFIGURATION_REQUIRED' }, 503);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))
    return respond({ error: 'JSON_REQUIRED' }, 415);
  let data;
  try {
    data = await request.json();
  } catch {
    return respond({ error: 'INVALID_JSON' }, 400);
  }
  if (
    !data ||
    typeof data !== 'object' ||
    !uuid.test(data.courseId || '') ||
    typeof data.progress !== 'number' ||
    !Number.isFinite(data.progress) ||
    data.progress < 0 ||
    data.progress > 100 ||
    typeof data.completed !== 'boolean' ||
    (data.completed && data.progress !== 100)
  )
    return respond({ error: 'INVALID_TRACKING_DATA' }, 400);
  const headers = { apikey: key, Authorization: authorization };
  const read = (path, options = {}) =>
    fetch(project + path, {
      ...options,
      headers: { ...headers, ...options.headers },
      signal: AbortSignal.timeout(15000),
    });
  try {
    const auth = await read('/auth/v1/user');
    if (auth.status === 401 || auth.status === 403)
      return respond({ error: 'INVALID_SESSION' }, 401);
    if (!auth.ok) return respond({ error: 'AUTHENTICATION_UNAVAILABLE' }, 503);
    const user = await auth.json();
    if (!uuid.test(user.id || '')) return respond({ error: 'INVALID_SESSION' }, 401);
    if (data.userId !== undefined && data.userId !== user.id)
      return respond({ error: 'USER_ID_MISMATCH' }, 403);
    const filter = new URLSearchParams({
      select: 'id,user_id,scorm_package_id',
      user_id: 'eq.' + user.id,
      scorm_package_id: 'eq.' + data.courseId,
      limit: '2',
    });
    const lookup = await read('/rest/v1/scorm_enrollments?' + filter);
    if (!lookup.ok) return respond({ error: 'ENROLLMENT_LOOKUP_FAILED' }, 503);
    const rows = await lookup.json();
    if (
      !Array.isArray(rows) ||
      rows.length !== 1 ||
      rows[0].user_id !== user.id ||
      rows[0].scorm_package_id !== data.courseId ||
      !uuid.test(rows[0].id || '')
    )
      return respond({ error: 'ENROLLMENT_REQUIRED' }, 403);
    const target = new URLSearchParams({
      id: 'eq.' + rows[0].id,
      user_id: 'eq.' + user.id,
      select: 'id,user_id,progress_percentage,status',
    });
    const saved = await read('/rest/v1/scorm_enrollments?' + target, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        progress_percentage: data.progress,
        status: data.completed ? 'completed' : 'incomplete',
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
    if (!saved.ok) return respond({ error: 'TRACKING_WRITE_FAILED' }, 503);
    const receipt = await saved.json();
    if (
      !Array.isArray(receipt) ||
      receipt.length !== 1 ||
      receipt[0].id !== rows[0].id ||
      receipt[0].user_id !== user.id ||
      receipt[0].progress_percentage !== data.progress ||
      receipt[0].status !== (data.completed ? 'completed' : 'incomplete')
    )
      return respond({ error: 'TRACKING_WRITE_UNCONFIRMED' }, 503);
    return respond({ success: true, enrollmentId: receipt[0].id });
  } catch {
    return respond({ error: 'TRACKING_UPSTREAM_UNAVAILABLE' }, 503);
  }
}

/** Only approved LMS origins may send browser tracking requests. */
function handleCORS(request) {
  const origin = request.headers.get('Origin');
  if (!TRACKING_ORIGINS.has(origin))
    return trackingResponse(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403);
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
}

/**
 * Get content type based on file extension
 */
function getContentType(path) {
  const ext = path.split('.').pop().toLowerCase();

  const types = {
    html: 'text/html',
    htm: 'text/html',
    js: 'application/javascript',
    json: 'application/json',
    css: 'text/css',
    xml: 'application/xml',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    pdf: 'application/pdf',
    zip: 'application/zip',
  };

  return types[ext] || 'application/octet-stream';
}
