import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCaseTasks, completeTask, initializeCaseTasks } from '@/lib/workflow/case-management';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await params;
    const tasks = await getCaseTasks(caseId);

    return NextResponse.json({ tasks });
  } catch (err: any) {
    logger.error('[GET /api/cases/[caseId]/tasks] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === 'initialize') {
      const taskCount = await initializeCaseTasks(caseId);
      return NextResponse.json({ success: true, taskCount });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    logger.error('[POST /api/cases/[caseId]/tasks] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, status, evidenceUrl, evidenceMetadata } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    if (status === 'completed') {
      const success = await completeTask(taskId, user.id, evidenceUrl, evidenceMetadata);
      if (!success) {
        return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from('case_tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error('[PATCH /api/cases/[caseId]/tasks] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
