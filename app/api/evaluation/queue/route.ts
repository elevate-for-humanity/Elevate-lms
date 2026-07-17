/**
 * Review Queue API
 * Manage human review workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { reviewQueueService } from '@/lib/evaluation/service';

const supabase = createPublicClient();

// ============================================================================
// GET /api/evaluation/queue - Get pending reviews
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const priority = searchParams.get('priority') || undefined;
    const assignedTo = searchParams.get('assignedTo') || undefined;

    const { items, total } = await reviewQueueService.getPending({ page, limit }, { priority, assignedTo });

    return NextResponse.json({
      success: true,
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error getting queue:', error);
    return NextResponse.json({ success: false, error: { code: 'QUEUE_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/evaluation/queue - Update queue item (assign/complete)
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authorization required' } }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const { action, queueItemId, decision, note } = body;

    if (action === 'assign' && queueItemId) {
      await reviewQueueService.assign(queueItemId, userId);
      return NextResponse.json({ success: true, message: 'Assigned successfully' });
    }

    if (action === 'complete' && queueItemId && decision) {
      await reviewQueueService.complete(queueItemId, decision, note || '');
      return NextResponse.json({ success: true, message: 'Review completed' });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action' } }, { status: 400 });
  } catch (error) {
    console.error('Error updating queue:', error);
    return NextResponse.json({ success: false, error: { code: 'UPDATE_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
