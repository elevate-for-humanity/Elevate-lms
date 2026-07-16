/**
 * Evaluation Engine API
 * Execute evaluations against tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { evaluationEngine, reviewQueueService } from '@/lib/evaluation/service';

const supabase = createPublicClient();

// ============================================================================
// POST /api/evaluation/evaluate - Run evaluation
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, input, output, executeCheckers = true, executeRubric = true } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, error: { code: 'MISSING_TASK_ID', message: 'taskId is required' } }, { status: 400 });
    }

    // Run evaluation
    const result = await evaluationEngine.evaluate(taskId, input, output, { executeCheckers, executeRubric });

    // Store result
    const { data: storedResult, error: storeError } = await supabase
      .from('evaluation_results')
      .insert(result)
      .select()
      .single();

    if (storeError) {
      console.error('Failed to store result:', storeError);
    }

    // If failed, add to review queue
    if (result.status === 'failed' || result.status === 'needs_review') {
      const failureReasons = result.checkerResults
        .filter(r => !r.passed)
        .map(r => r.message || r.checkerName);
      
      await reviewQueueService.addToQueue(result.id, taskId, failureReasons);
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('Error running evaluation:', error);
    return NextResponse.json({ success: false, error: { code: 'EVAL_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
