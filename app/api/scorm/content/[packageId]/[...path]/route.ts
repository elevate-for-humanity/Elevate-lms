// PUBLIC ROUTE: SCORM content delivery — auth inside handler

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.ico': 'image/x-icon',
  '.swf': 'application/x-shockwave-flash',
};

function contentTypeFor(filePath: string): string {
  const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

async function _GET(
  request: NextRequest,
  ctx: { params: Promise<{ packageId: string; path: string[] }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { packageId, path } = await ctx.params;

  const supabase = await requireAdminClient();

  // Convention: scorm/<packageId>/<relative file path>
  const filePath = `scorm/${packageId}/${(path || []).join('/')}`;

  const { data, error } = await supabase.storage.from('course-content').download(filePath);

  if (error || !data) {
    return NextResponse.json({ error: 'SCORM content not found', filePath }, { status: 404 });
  }

  const arrayBuffer = await data.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentTypeFor(filePath),
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
    },
  });
}
export const GET = withApiAudit('/api/scorm/content/[packageId]/[...path]', _GET);
