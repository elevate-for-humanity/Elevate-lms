import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ticketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['technical', 'billing', 'enrollment', 'program', 'general', 'urgent']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

// GET - Fetch user's tickets or all tickets (admin)
export async function GET(request: NextRequest) {
  try {
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
    
    const adminClient = createAdminClient();
    const isAdmin = profile?.role && ['admin', 'super_admin', 'staff'].includes(profile.role);
    
    let query = adminClient
      .from('support_tickets')
      .select('*, support_messages(id, message, created_at, is_staff)')
      .order('created_at', { ascending: false });
    
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    
    const { data: tickets, error } = await query.limit(50);
    
    if (error) {
      logger.error('Tickets fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
    
    return NextResponse.json({ tickets: tickets || [] });
  } catch (error) {
    logger.error('Support API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const validatedData = ticketSchema.parse(body);
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Generate ticket number
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    
    const adminClient = createAdminClient();
    const { data: ticket, error } = await adminClient
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        user_id: user?.id || null,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        subject: validatedData.subject,
        description: validatedData.description,
        category: validatedData.category,
        priority: validatedData.priority,
        status: 'open',
        attachments: validatedData.attachments || [],
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Ticket create error:', error);
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }
    
    // Create initial message
    await adminClient
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        user_id: user?.id || null,
        message: validatedData.description,
        is_staff: false,
      });
    
    return NextResponse.json({ 
      success: true, 
      ticket,
      message: `Ticket ${ticketNumber} created successfully. We'll respond within 24 hours.`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    logger.error('Support POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
