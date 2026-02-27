import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
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

    // Get all protocols
    const { data: protocols, error: protocolsError } = await db
      .from('customer_service_protocols')
      .select('*')
      .order('category');

    if (protocolsError) {
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      );
    }

    // Get active tickets (assigned to user or unassigned)
    const { data: tickets, error: ticketsError } = await db
      .from('service_tickets')
      .select(
        `
        *,
        student:student_id(id, first_name, last_name, email),
        assigned:assigned_to(id, first_name, last_name)
      `
      )
      .in('status', ['open', 'in_progress'])
      .or(`assigned_to.eq.${user.id},assigned_to.is.null`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (ticketsError) {
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      protocols,
      tickets,
      openTickets: tickets?.filter((t) => t.status === 'open').length || 0,
      inProgressTickets:
        tickets?.filter((t) => t.status === 'in_progress').length || 0,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/staff/customer-service', _GET);
