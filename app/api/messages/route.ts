export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// GET /api/messages - Fetch user's messages
async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'inbox'; // inbox or sent

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from('messages')
      .select(
        `
        id,
        subject,
        body,
        read,
        created_at,
        sender:sender_id (
          id,
          email,
          profiles (
            full_name
          )
        ),
        recipient:recipient_id (
          id,
          email,
          profiles (
            full_name
          )
        )
      `
      )
      .order('created_at', { ascending: false });

    if (type === 'inbox') {
      query = query.eq('recipient_id', user.id);
    } else if (type === 'sent') {
      query = query.eq('sender_id', user.id);
    }

    const { data: messages, error } = await query;

    if (error) {
      logger.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages });
  } catch (error) { 
    logger.error('Error in GET /api/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a new message
async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { recipientId, subject, messageBody } = body;

    if (!recipientId || !subject || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientId, subject, messageBody' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        subject,
        body: messageBody,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error sending message:', error);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) { 
    logger.error('Error in POST /api/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/messages', _GET);
export const POST = withApiAudit('/api/messages', _POST);
