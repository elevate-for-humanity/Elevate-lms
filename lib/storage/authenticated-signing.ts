import 'server-only';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

/** Storage SELECT policies, evaluated as the caller, authorize every object. */
export async function signAuthenticatedFile(request: Request, userId: string, service: string) {
  const url = new URL(request.url);
  const bucket = url.searchParams.get('bucket');
  const path = url.searchParams.get('path');
  const lifetime = url.searchParams.get('expiresIn') ?? '300';
  const expiresIn = Number(lifetime);
  if (!bucket || !/^[a-zA-Z0-9_-]{1,100}$/.test(bucket) || !path || path.length > 2048 ||
      path.split('/').some(part => !part || part === '.' || part === '..') ||
      [...path].some(character => character === '\\' || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) || /%[0-9a-f]{2}/i.test(path) ||
      !/^\d+$/.test(lifetime) || !Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > 3600) {
    return NextResponse.json({ error: 'Invalid file reference or expiry' }, { status: 400, headers });
  }
  const limited = await applyRateLimit(request, 'api', { key: `storage-sign:${userId}` });
  if (limited) {
    for (const [key, value] of Object.entries(headers)) limited.headers.set(key, value);
    return limited;
  }
  try {
    const db = await createClient();
    const { data, error } = await db.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'File unavailable or access denied' }, { status: 404, headers });
    }
    return NextResponse.json({ signedUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(), service }, { headers });
  } catch {
    return NextResponse.json({ error: 'File delivery unavailable' }, { status: 503, headers });
  }
}
