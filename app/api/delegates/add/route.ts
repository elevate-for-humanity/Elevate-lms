import { requireAdminClient } from '@/lib/supabase/admin';

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: prof } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (prof?.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const body = await req.json();
  const { program_holder_id, email } = body;

  if (!program_holder_id || !email) {
    return new Response('Missing fields', { status: 400 });
  }

  try {
    // Find user by email via profiles table
    const adminDb = await requireAdminClient();
    const { data: profileRow } = await adminDb
      .from('profiles')
      .select('id, email')
      .ilike('email', email.trim())
      .maybeSingle();
    const u = profileRow;

    if (!u) {
      return new Response('User not found (create account first)', {
        status: 400,
      });
    }

    // Create delegate record
    const { error: delError } = await supabase.from('delegates').insert({
      program_holder_id,
      user_id: u.id,
    });

    if (delError) {
      logger.error('Delegate add failed', undefined, { detail: delError.message });
      return new Response('Internal server error', { status: 500 });
    }

    // Update user profile with program holder and partner role
    await supabase.from('profiles').upsert(
      {
        id: u.id,
        program_holder_id: program_holder_id,
        role: 'partner',
      },
      {
        onConflict: 'id',
      },
    );

    return Response.json({ ok: true });
  } catch (error) {
    logger.error('Error adding delegate:', error);
    return new Response('Failed to add delegate', { status: 500 });
  }
}
export const POST = withApiAudit('/api/delegates/add', _POST);
