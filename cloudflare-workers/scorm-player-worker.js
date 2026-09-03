/**
 * Cloudflare Worker for SCORM Course Delivery
 * Handles SCORM package serving with CORS and proper headers
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Route handling
    if (url.pathname.startsWith('/scorm/')) {
      return handleSCORM(request, env, url);
    }

    if (url.pathname.startsWith('/api/scorm/track')) {
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
async function handleTracking(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const data = await request.json();
    const { userId, courseId, progress, completed } = data;

    // Store tracking data in KV or D1
    if (env.SCORM_TRACKING) {
      const key = `${userId}:${courseId}`;
      await env.SCORM_TRACKING.put(
        key,
        JSON.stringify({
          progress,
          completed,
          lastUpdated: new Date().toISOString(),
        }),
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Tracking error:', error);
    return new Response('Error tracking progress', { status: 500 });
  }
}

/**
 * Handle CORS preflight
 */
function handleCORS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
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
