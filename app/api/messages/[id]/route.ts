
import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// PATCH /api/messages/[id] - Mark message as read
async function _PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Update message (RLS ensures user can only update their own received messages)
    const { data: message, error } = await supabase
      .from('messages')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('recipient_id', user.id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating message:', error);
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      );
    }

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ message });
  } catch (error) { 
    logger.error('Error in PATCH /api/messages/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id] - Delete message
async function _DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Delete message (user can delete messages they sent or received)
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

    if (error) {
      logger.error('Error deleting message:', error);
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    logger.error('Error in DELETE /api/messages/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const PATCH = withApiAudit('/api/messages/[id]', _PATCH);
export const DELETE = withApiAudit('/api/messages/[id]', _DELETE);
