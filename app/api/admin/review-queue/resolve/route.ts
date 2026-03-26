import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      queue_item_id,
      action,
      approved_hours,
      selected_shop_id,
      reject_reason,
    } = body;

    if (!queue_item_id || !action) {
      return NextResponse.json({ error: 'queue_item_id and action required' }, { status: 400 });
    }

    // Get queue item
    const { data: item, error: itemError } = await supabase
      .from('review_queue')
      .select('*')
      .eq('id', queue_item_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
    }

    const reasonCodes: string[] = [];
    const inputSnapshot: Record<string, any> = {
      queue_item_id,
      action,
      queue_type: item.queue_type,
      subject_type: item.subject_type,
      subject_id: item.subject_id,
    };

    // Process based on action
    if (action === 'approve') {
      reasonCodes.push('HUMAN_APPROVED');

      // Handle transcript review - update transfer_hours
      if (item.queue_type === 'transcript_review' && approved_hours !== undefined) {
        inputSnapshot.approved_hours = approved_hours;
        
        await supabase
          .from('transfer_hours')
          .update({
            approved_hours: approved_hours,
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', item.subject_id);
        
        reasonCodes.push('TRANSFER_HOURS_SET');
      }

      // Handle routing review - assign shop
      if (item.queue_type === 'routing_review' && selected_shop_id) {
        inputSnapshot.selected_shop_id = selected_shop_id;

        // Update routing score status
        await supabase
          .from('shop_routing_scores')
          .update({ status: 'assigned', assigned_at: new Date().toISOString() })
          .eq('application_id', item.subject_id)
          .eq('shop_id', selected_shop_id);

        // Mark others as expired
        await supabase
          .from('shop_routing_scores')
          .update({ status: 'expired' })
          .eq('application_id', item.subject_id)
          .neq('shop_id', selected_shop_id)
          .eq('status', 'recommended');

        // Update application
        await supabase
          .from('applications')
          .update({
            assigned_shop_id: selected_shop_id,
            assigned_at: new Date().toISOString(),
          })
          .eq('id', item.subject_id);

        reasonCodes.push('SHOP_ASSIGNED');
      }

      // Handle partner docs review
      if (item.queue_type === 'partner_docs_review') {
        await supabase
          .from('partners')
          .update({
            status: 'active',
            approved_at: new Date().toISOString(),
          })
          .eq('id', item.subject_id);

        reasonCodes.push('PARTNER_APPROVED');
      }

      // Handle document review
      if (item.queue_type === 'document_review') {
        await supabase
          .from('documents')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', item.subject_id);

        reasonCodes.push('DOCUMENT_APPROVED');
      }

    } else if (action === 'reject') {
      if (!reject_reason) {
        return NextResponse.json({ error: 'reject_reason required' }, { status: 400 });
      }

      reasonCodes.push('HUMAN_REJECTED');
      inputSnapshot.reject_reason = reject_reason;

      // Update underlying record status
      if (item.queue_type === 'transcript_review') {
        await supabase
          .from('transfer_hours')
          .update({
            status: 'rejected',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            notes: reject_reason,
          })
          .eq('id', item.subject_id);
      } else if (item.queue_type === 'document_review') {
        await supabase
          .from('documents')
          .update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', item.subject_id);
      }

    } else if (action === 'request_reupload') {
      reasonCodes.push('REUPLOAD_REQUESTED');

      // Mark document as needs reupload
      if (item.subject_type === 'document') {
        await supabase
          .from('documents')
          .update({ status: 'needs_reupload' })
          .eq('id', item.subject_id);
      }
    }

    // Write automated_decision
    await supabase.from('automated_decisions').insert({
      subject_type: item.subject_type,
      subject_id: item.subject_id,
      decision: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'needs_review',
      reason_codes: reasonCodes,
      input_snapshot: inputSnapshot,
      ruleset_version: 'human_review',
      actor: user.id,
    });

    // Update queue item
    await supabase
      .from('review_queue')
      .update({
        status: 'resolved',
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        resolution: action === 'reject' ? reject_reason : `${action} by admin`,
      })
      .eq('id', queue_item_id);

    // Audit log
    await auditLog({
      actorId: user.id,
      actorRole: profile.role,
      action: AuditAction.CASE_UPDATED,
      entity: AuditEntity.APPLICATION,
      entityId: item.subject_id,
      metadata: {
        queue_item_id,
        queue_type: item.queue_type,
        action,
        reason_codes: reasonCodes,
      },
    });

    return NextResponse.json({ success: true, action, reason_codes: reasonCodes });
  } catch (error) {
    logger.error('Review resolve error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
