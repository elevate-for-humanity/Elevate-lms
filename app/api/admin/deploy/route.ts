import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/deploy
 * Triggers a Netlify deployment via build hook
 */
export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Verify admin access
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Trigger Netlify build hook
    const buildHookUrl = process.env.NETLIFY_BUILD_HOOK_URL;
    
    if (!buildHookUrl) {
      return NextResponse.json({ 
        error: 'Build hook not configured',
        message: 'Set NETLIFY_BUILD_HOOK_URL in environment variables'
      }, { status: 500 });
    }

    const response = await fetch(buildHookUrl, {
      method: 'POST',
    });

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Deployment triggered successfully' 
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to trigger deployment',
        status: response.status 
      }, { status: 500 });
    }
  } catch (error) {
    logger.error('Deploy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
