export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/support/ticket/route.ts
import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { createZendeskTicket } from '@/lib/support/zendesk';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const session = await requireApiAuth();
  const { subject, message } = await request.json();

  if (!subject || !message) {
    return NextResponse.json(
      { error: 'subject and message are required' },
      { status: 400 }
    );
  }

  const email = session.user?.email as string;
  const userId = session.user?.id;

  // Save to Supabase for internal tracking
  const supabase = createAdminClient();
  const { error: dbError } = await supabase
    .from('customer_service_tickets')
    .insert({
      student_id: userId,
      subject: subject,
      description: message,
      status: 'open',
      priority: 'normal',
      category: 'general',
    });

  if (dbError) {
    logger.error('Error saving support ticket to database:', dbError);
  }

  // Also try Zendesk if configured
  try {
    await createZendeskTicket({
      requesterEmail: email,
      subject,
      body: message,
      tags: ['elevate_lms', 'in_app'],
    });
  } catch (err) {
    logger.warn('Zendesk ticket creation failed (may not be configured):', err);
  }

  return NextResponse.json({ ok: true });
}
