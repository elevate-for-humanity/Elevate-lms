import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { id } = await params;
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const body = await req.json();
    const { full_name, email, phone, answers } = body;

    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, email' },
        { status: 400 }
      );
    }

    // Load event
    const { data: event, error: eErr } = await db
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    if (eErr || !event) throw eErr || new Error('Event not found');

    // Check if event is published
    if (event.status !== 'published') {
      return NextResponse.json(
        { error: 'Event is not available for registration' },
        { status: 400 }
      );
    }

    // Count registrations
    const { count } = await db
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id)
      .neq('status', 'cancelled');

    let status: string = 'registered';
    if (event.capacity && (count || 0) >= event.capacity) {
      if (event.allow_waitlist) {
        status = 'waitlisted';
      } else {
        return NextResponse.json(
          { error: 'Event is at full capacity' },
          { status: 400 }
        );
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error }: any = await db
      .from('event_registrations')
      .insert({
        event_id: id,
        profile_id: user?.id ?? null,
        full_name,
        email,
        phone,
        status,
        answers,
      })
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json(
      {
        registration: data,
        status,
        message:
          status === 'waitlisted'
            ? 'You have been added to the waitlist'
            : 'Registration successful',
      },
      { status: 201 }
    );
  } catch (err: any) {
    logger.error(
      'POST /events/[id]/register error',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    );
  }
}
