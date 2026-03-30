
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { apiAuthGuard } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const tutorialId = searchParams.get('tutorialId');

    if (action === 'progress' && tutorialId) {
      const supabase = await createClient();
      const { data, error }: any = await supabase
        .from('user_tutorials')
        .select('*')
        .eq('user_id', user.id)
        .eq('tutorial_id', tutorialId)
        .single();

      if (error || !data) {
        return NextResponse.json({ progress: null });
      }

      return NextResponse.json({
        progress: {
          currentStep: data.current_step,
          completedSteps: data.completed_steps || [],
          completed: data.completed,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) { 
    logger.error('Tutorials GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tutorial data' },
      { status: 500 }
    );
  }
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    const body = await parseBody<Record<string, any>>(request);
    const { action, tutorialId, stepId, stepIndex } = body;

    const supabase = await createClient();

    if (action === 'update-progress') {
      const { data: current } = await supabase
        .from('user_tutorials')
        .select('completed_steps')
        .eq('user_id', user.id)
        .eq('tutorial_id', tutorialId)
        .single();

      const completedSteps = current?.completed_steps || [];
      if (!completedSteps.includes(stepId)) {
        completedSteps.push(stepId);
      }

      await supabase.from('user_tutorials').upsert({
        user_id: user.id,
        tutorial_id: tutorialId,
        current_step: stepIndex + 1,
        completed_steps: completedSteps,
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'complete') {
      await supabase
        .from('user_tutorials')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('tutorial_id', tutorialId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) { 
    logger.error('Tutorials POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process tutorial action' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/tutorials', _GET);
export const POST = withApiAudit('/api/tutorials', _POST);
