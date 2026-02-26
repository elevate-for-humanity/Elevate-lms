import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate a short-lived signed URL for a document in a private bucket.
 * Admin-only — requires authenticated user with admin/super_admin role.
 *
 * GET /api/admin/documents/signed-url?path=<file_path>&bucket=<bucket_name>
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const supabase = await createClient();
    const admin = createAdminClient();
    const db = admin || supabase;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check — admin only
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['admin', 'super_admin', 'org_admin'];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    const bucket = searchParams.get('bucket') || 'documents';

    if (!filePath) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    // Allowlist of buckets admins can access
    const allowedBuckets = [
      'documents',
      'enrollment-documents',
      'program-holder-documents',
      'apprentice-uploads',
      'tax-documents',
    ];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    const { data, error } = await db.storage
      .from(bucket)
      .createSignedUrl(filePath, 60); // 60-second expiry for PII documents

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
