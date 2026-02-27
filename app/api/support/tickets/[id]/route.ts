import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

// GET - Fetch single ticket with messages
async function _GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { id } = await params;
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();
    
    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
    const { data: ticket, error } = await adminClient
      .from('support_tickets')
      .select('*, support_messages(id, message, created_at, is_staff, user_id)')
      .eq('id', id)
      .single();
    
    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    
    // Check access
    if (user) {
      const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const isAdmin = profile?.role && ['admin', 'super_admin', 'staff'].includes(profile.role);
      if (!isAdmin && ticket.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (ticket.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ ticket });
  } catch (error) {
    logger.error('Ticket GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update ticket status or add message
async function _PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { id } = await params;
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const isStaff = profile?.role && ['admin', 'super_admin', 'staff'].includes(profile.role);
    
    const body = await request.json();
    const { status, message, priority, assigned_to } = body;
    
    const adminClient = createAdminClient();
    
    // Update ticket if status/priority/assignment changed
    if (status || priority || assigned_to) {
      if (!isStaff) {
        return NextResponse.json({ error: 'Only staff can update ticket status' }, { status: 403 });
      }
      
      const updates: any = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (assigned_to) updates.assigned_to = assigned_to;
      if (status === 'resolved') updates.resolved_at = new Date().toISOString();
      
      await adminClient
        .from('support_tickets')
        .update(updates)
        .eq('id', id);
    }
    
    // Add message if provided
    if (message) {
      await adminClient
        .from('support_messages')
        .insert({
          ticket_id: id,
          user_id: user.id,
          message,
          is_staff: isStaff,
        });
      
      // Update ticket's updated_at
      await adminClient
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);
    }
    
    // Fetch updated ticket
    const { data: ticket } = await adminClient
      .from('support_tickets')
      .select('*, support_messages(id, message, created_at, is_staff)')
      .eq('id', id)
      .single();
    
    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    logger.error('Ticket PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/support/tickets/[id]', _GET);
export const PATCH = withApiAudit('/api/support/tickets/[id]', _PATCH);
