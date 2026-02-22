export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { getUserByEmail } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: prof } = await db
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (prof?.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const body = await req.json();
  const { program_holder_id, email } = body;

  if (!program_holder_id || !email) {
    return new Response('Missing fields', { status: 400 });
  }

  try {
    // Find user by email using admin client
    const u = await getUserByEmail(email);

    if (!u) {
      return new Response('User not found (create account first)', {
        status: 400,
      });
    }

    // Create delegate record
    const { error: delError } = await db.from('delegates').insert({
      program_holder_id,
      user_id: u.id,
    });

    if (delError) {
      return new Response(delError.message, { status: 500 });
    }

    // Update user profile with program holder and partner role
    await db.from('user_profiles').upsert(
      {
        user_id: u.id,
        program_holder_id: program_holder_id,
        role: 'partner',
      },
      {
        onConflict: 'user_id',
      }
    );

    return Response.json({ ok: true });
  } catch (error) { 
    logger.error('Error adding delegate:', error);
    return new Response('Failed to add delegate', { status: 500 });
  }
}
