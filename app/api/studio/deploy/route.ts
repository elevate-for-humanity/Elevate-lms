import { logger } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase/admin';

import { NextRequest, NextResponse } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

// Deploy to Netlify
async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const { apiRequireAdmin } = await import('@/lib/admin/guards');
    try { await apiRequireAdmin(req); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const userId = auth.id;

  try {
    const { provider, repo, branch, project_id, token } = await req.json();

    if (!repo || !branch) {
      return NextResponse.json(
        { error: 'Missing required fields (repo, branch)' },
        { status: 400 }
      );
    }

    let deploymentUrl: string;
    let deploymentId: string;

    if (provider === 'netlify' || !provider) {
      // Trigger Netlify build hook or deployment
      const hookUrl = process.env.NETLIFY_BUILD_HOOK;
      
      if (hookUrl) {
        const response = await fetch(hookUrl, {
          method: 'POST',
          body: JSON.stringify({ branch }),
        });

        if (!response.ok) {
          throw new Error('Netlify build trigger failed');
        }

        deploymentId = `netlify_${Date.now()}`;
        deploymentUrl = 'Build triggered - check Netlify dashboard';
      } else {
        // Use Netlify API
        const response = await fetch(`https://api.netlify.com/api/v1/sites/${project_id}/builds`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token || process.env.NETLIFY_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.message || 'Netlify deployment failed');
        }

        deploymentId = data.id;
        deploymentUrl = data.deploy_ssl_url || data.url;
      }
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    // Save deployment to database
    if (userId) {
      const supabase = await getAdminClient();
      await supabase.from('studio_deployments').insert({
        user_id: userId,
        provider,
        repo,
        branch,
        deployment_id: deploymentId,
        url: deploymentUrl,
        status: 'pending',
      });
    }

    return NextResponse.json({
      ok: true,
      provider,
      deploymentId,
      url: deploymentUrl,
      status: 'pending',
    });
  } catch (error) {
    logger.error('Deploy error:', error);
    return NextResponse.json(
      { error: 'Deployment failed', message: 'Deployment failed' },
      { status: 500 }
    );
  }
}

// Get deployment status
async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');
  const provider = req.nextUrl.searchParams.get('provider');
  const deploymentId = req.nextUrl.searchParams.get('id');
  const token = req.headers.get('x-deploy-token');

  if (!provider || !deploymentId) {
    return NextResponse.json({ error: 'Missing provider or id' }, { status: 400 });
  }

  try {
    let status: string;
    let url: string | null = null;

    if (provider === 'netlify' || !provider) {
      const response = await fetch(`https://api.netlify.com/api/v1/deploys/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${token || process.env.NETLIFY_TOKEN}`,
        },
      });

      const data = await response.json();
      status = data.state;
      url = data.deploy_ssl_url || data.url;
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    // Update database
    if (userId) {
      const supabase = await getAdminClient();
      await supabase
        .from('studio_deployments')
        .update({ status, url, updated_at: new Date().toISOString() })
        .eq('deployment_id', deploymentId);
    }

    return NextResponse.json({
      deploymentId,
      status,
      url,
    });
  } catch (error) {
    logger.error('Deploy status error:', error);
    return NextResponse.json(
      { error: 'Failed to get deployment status' },
      { status: 500 }
    );
  }
}

// List deployments
async function _PUT(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { repo } = await req.json();
    
    const supabase = await getAdminClient();
    let query = supabase
      .from('studio_deployments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (repo) {
      query = query.eq('repo', repo);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    logger.error('List deployments error:', error);
    return NextResponse.json(
      { error: 'Failed to list deployments' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/studio/deploy', _GET);
export const POST = withApiAudit('/api/studio/deploy', _POST);
export const PUT = withApiAudit('/api/studio/deploy', _PUT);
