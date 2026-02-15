import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

// GET - Fetch single ticket with messages
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const adminClient = createAdminClient();
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
      const { data: profile } = await supabase
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
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
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
