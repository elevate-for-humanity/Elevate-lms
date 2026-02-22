import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is staff/admin
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      !['admin', 'super_admin', 'staff', 'advisor'].includes(profile.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await parseBody<{
      student_id?: string;
      issue?: string;
      priority?: string;
      assigned_to?: string;
    }>(request);
    const { student_id, issue, priority, assigned_to } = body;

    if (!student_id || !issue) {
      return NextResponse.json(
        { error: 'student_id and issue are required' },
        { status: 400 }
      );
    }

    // Create ticket
    const { data: ticket, error: ticketError } = await db
      .from('service_tickets')
      .insert({
        student_id,
        issue,
        priority: priority || 'medium',
        assigned_to: assigned_to || null,
        created_by: user.id,
        status: 'open',
      })
      .select(
        `
        *,
        student:student_id(id, first_name, last_name, email),
        assigned:assigned_to(id, first_name, last_name)
      `
      )
      .single();

    if (ticketError) {
      return NextResponse.json({ error: 'Ticket operation failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
