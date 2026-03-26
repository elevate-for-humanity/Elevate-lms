import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// GET - Fetch user's messages/conversations
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationWith = searchParams.get('with');

  if (conversationWith) {
    // Get messages in a specific conversation
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
        recipient:profiles!messages_recipient_id_fkey(id, full_name, avatar_url)
      `)
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${conversationWith}),and(sender_id.eq.${conversationWith},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('sender_id', conversationWith)
      .is('read_at', null);

    return NextResponse.json({ messages });
  }

  // Get all conversations (grouped by other participant)
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
      recipient:profiles!messages_recipient_id_fkey(id, full_name, avatar_url)
    `)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }

  // Group into conversations
  const conversationMap = new Map();
  
  for (const msg of messages || []) {
    const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
    const other = msg.sender_id === user.id ? msg.recipient : msg.sender;
    
    if (!conversationMap.has(otherId)) {
      conversationMap.set(otherId, {
        id: otherId,
        participant: other,
        lastMessage: msg,
        unreadCount: msg.recipient_id === user.id && !msg.read_at ? 1 : 0,
      });
    } else if (msg.recipient_id === user.id && !msg.read_at) {
      conversationMap.get(otherId).unreadCount++;
    }
  }

  const conversations = Array.from(conversationMap.values());

  return NextResponse.json({ conversations });
}

// POST - Send a new message
async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { recipientId: string; content: string; subject?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { recipientId, content, subject } = body;

  if (!recipientId || !content) {
    return NextResponse.json({ error: 'Missing recipientId or content' }, { status: 400 });
  }

  // Verify recipient exists
  const { data: recipient } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', recipientId)
    .single();

  if (!recipient) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  // Create message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content,
      subject: subject || null,
      created_at: new Date().toISOString(),
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
      recipient:profiles!messages_recipient_id_fkey(id, full_name, avatar_url)
    `)
    .single();

  if (error) {
    logger.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }

  return NextResponse.json({ message }, { status: 201 });
}
export const GET = withApiAudit('/api/lms/messages', _GET);
export const POST = withApiAudit('/api/lms/messages', _POST);
