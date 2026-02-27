import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ returnId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { returnId } = await params;

    // Get the return with related data
    const { data: submission, error } = await db
      .from('franchise_return_submissions')
      .select(`
        *,
        preparer:franchise_preparers(*),
        client:franchise_clients(*),
        office:franchise_offices(*)
      `)
      .eq('id', returnId)
      .single();

    if (error || !submission) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    // Check access
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    if (!isAdmin) {
      // Check if user is office owner
      const isOwner = submission.office?.owner_id === user.id;
      
      // Check if user is the preparer
      const isPreparer = submission.preparer?.user_id === user.id;

      if (!isOwner && !isPreparer) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(submission);
  } catch (error) {
    logger.error('Error getting return:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function _PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ returnId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { returnId } = await params;
    const body = await request.json();

    // Get the return
    const { data: submission, error: fetchError } = await db
      .from('franchise_return_submissions')
      .select('*, office:franchise_offices(owner_id)')
      .eq('id', returnId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    // Check access - only admins and office owners can reassign
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';
    const isOwner = submission.office?.owner_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle preparer reassignment
    if (body.preparer_id && body.preparer_id !== submission.preparer_id) {
      // Verify new preparer belongs to same office
      const { data: newPreparer, error: preparerError } = await db
        .from('franchise_preparers')
        .select('*')
        .eq('id', body.preparer_id)
        .single();

      if (preparerError || !newPreparer) {
        return NextResponse.json({ error: 'New preparer not found' }, { status: 400 });
      }

      if (newPreparer.office_id !== submission.office_id) {
        return NextResponse.json(
          { error: 'New preparer must belong to the same office' },
          { status: 400 }
        );
      }

      if (newPreparer.status !== 'active') {
        return NextResponse.json(
          { error: 'New preparer is not active' },
          { status: 400 }
        );
      }

      // Log the reassignment
      await db.from('franchise_audit_log').insert({
        action: 'preparer_reassigned',
        entity_type: 'return',
        entity_id: returnId,
        office_id: submission.office_id,
        actor_id: user.id,
        details: {
          old_preparer_id: submission.preparer_id,
          new_preparer_id: body.preparer_id,
          reason: body.reassignment_reason
        },
        created_at: new Date().toISOString()
      });
    }

    // Update allowed fields
    const allowedFields = ['preparer_id', 'status', 'notes'];
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data: updated, error: updateError } = await db
      .from('franchise_return_submissions')
      .update(updates)
      .eq('id', returnId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update return: ${'Update failed'}`);
    }

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Error updating return:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/franchise/returns/[returnId]', _GET);
export const PATCH = withApiAudit('/api/franchise/returns/[returnId]', _PATCH);
