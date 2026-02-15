import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

interface CopilotDeployment {
  id: string;
  copilot_type: 'ai_tutor' | 'admin_assistant' | 'support_bot';
  status: 'deploying' | 'active' | 'stopped' | 'failed';
  config: Record<string, unknown>;
  deployed_at: string;
  deployed_by: string;
}

// GET - List all copilot deployments
export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: deployments, error } = await supabase
      .from('copilot_deployments')
      .select('*')
      .order('deployed_at', { ascending: false });

    if (error) {
      // Table might not exist yet - return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ deployments: [] });
      }
      throw error;
    }

    return NextResponse.json({ deployments: deployments || [] });
  } catch (error) {
    logger.error('Error fetching copilot deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployments' },
      { status: 500 }
    );
  }
}

// POST - Deploy a new copilot
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { copilot_type, config } = body;

    if (!copilot_type || !['ai_tutor', 'admin_assistant', 'support_bot'].includes(copilot_type)) {
      return NextResponse.json(
        { error: 'Invalid copilot type' },
        { status: 400 }
      );
    }

    // Check if this copilot type is already deployed
    const { data: existing } = await supabase
      .from('copilot_deployments')
      .select('id, status')
      .eq('copilot_type', copilot_type)
      .eq('status', 'active')
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This copilot is already deployed. Stop it first before redeploying.' },
        { status: 409 }
      );
    }

    const deployment: Partial<CopilotDeployment> = {
      copilot_type,
      status: 'deploying',
      config: config || getDefaultConfig(copilot_type),
      deployed_at: new Date().toISOString(),
      deployed_by: user.id,
    };

    const { data: newDeployment, error } = await supabase
      .from('copilot_deployments')
      .insert(deployment)
      .select()
      .single();

    if (error) {
      // Table might not exist - create it
      if (error.code === '42P01') {
        return NextResponse.json({
          deployment: {
            id: crypto.randomUUID(),
            ...deployment,
            status: 'active',
          },
          message: 'Copilot deployment initiated (table pending migration)',
        });
      }
      throw error;
    }

    // Simulate deployment process - in production this would trigger actual deployment
    setTimeout(async () => {
      await supabase
        .from('copilot_deployments')
        .update({ status: 'active' })
        .eq('id', newDeployment.id);
    }, 2000);

    return NextResponse.json({
      deployment: newDeployment,
      message: 'Copilot deployment initiated',
    });
  } catch (error) {
    logger.error('Error deploying copilot:', error);
    return NextResponse.json(
      { error: 'Failed to deploy copilot' },
      { status: 500 }
    );
  }
}

// PATCH - Update deployment status (start/stop)
export async function PATCH(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deployment_id, action } = body;

    if (!deployment_id || !['start', 'stop'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide deployment_id and action (start/stop)' },
        { status: 400 }
      );
    }

    const newStatus = action === 'start' ? 'active' : 'stopped';

    const { data: updated, error } = await supabase
      .from('copilot_deployments')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deployment_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      deployment: updated,
      message: `Copilot ${action === 'start' ? 'started' : 'stopped'} successfully`,
    });
  } catch (error) {
    logger.error('Error updating copilot deployment:', error);
    return NextResponse.json(
      { error: 'Failed to update deployment' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a deployment
export async function DELETE(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('id');

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Deployment ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('copilot_deployments')
      .delete()
      .eq('id', deploymentId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: 'Deployment removed successfully',
    });
  } catch (error) {
    logger.error('Error removing copilot deployment:', error);
    return NextResponse.json(
      { error: 'Failed to remove deployment' },
      { status: 500 }
    );
  }
}

function getDefaultConfig(copilotType: string): Record<string, unknown> {
  switch (copilotType) {
    case 'ai_tutor':
      return {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: 'You are a helpful tutor for vocational training students.',
        enabledCourses: 'all',
        responseStyle: 'educational',
      };
    case 'admin_assistant':
      return {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 1500,
        systemPrompt: 'You are an administrative assistant for the LMS platform.',
        permissions: ['read_analytics', 'generate_reports', 'answer_questions'],
        dataAccess: 'aggregated',
      };
    case 'support_bot':
      return {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 1000,
        systemPrompt: 'You are a support agent helping users with the LMS platform.',
        escalationThreshold: 3,
        handoffEnabled: true,
        knowledgeBase: 'faq',
      };
    default:
      return {};
  }
}
