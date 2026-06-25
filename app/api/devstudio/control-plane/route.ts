/**
 * Control Plane API Routes
 * GET /api/devstudio/control-plane/map - Get platform map
 * GET /api/devstudio/control-plane/health - Health check all services
 * POST /api/devstudio/control-plane/action - Execute control action
 * GET /api/devstudio/control-plane/logs - Get platform logs
 * GET /api/devstudio/control-plane/integrations - Get integrations
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_ROLES = new Set(['admin']);

// GET /api/devstudio/control-plane/map
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop();

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const { requireAdminClient } = await import('@/lib/supabase/admin');
    const { getPlatformMap, checkAllHealth, getPlatformLogs, getIntegrations } = await import('@/lib/control-plane');
    const { logger } = await import('@/lib/logger');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await requireAdminClient();
    const { data: profile } = await db
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile || !ALLOWED_ROLES.has(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const tenantId = profile.tenant_id;

    switch (endpoint) {
      case 'map': {
        const map = await getPlatformMap(tenantId);
        return NextResponse.json(map);
      }
      case 'health': {
        const health = await checkAllHealth(tenantId);
        return NextResponse.json(health);
      }
      case 'logs': {
        const params = url.searchParams;
        const logs = await getPlatformLogs(tenantId, {
          event_type: params.get('event_type') || undefined,
          severity: params.get('severity') || undefined,
          limit: parseInt(params.get('limit') || '50'),
          offset: parseInt(params.get('offset') || '0'),
        });
        return NextResponse.json(logs);
      }
      case 'integrations': {
        const integrations = await getIntegrations(tenantId);
        return NextResponse.json(integrations);
      }
      default:
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    const { logger } = await import('@/lib/logger');
    logger.error('Control plane GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/devstudio/control-plane/action
export async function POST(req: NextRequest) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const { requireAdminClient } = await import('@/lib/supabase/admin');
    const { executeControlAction, approveAction } = await import('@/lib/control-plane');
    const { logger } = await import('@/lib/logger');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await requireAdminClient();
    const { data: profile } = await db
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile || !ALLOWED_ROLES.has(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { action_type, parameters, action_id, approve, reason } = body;

    // Handle approval
    if (action_id && approve !== undefined) {
      const result = await approveAction(action_id, user.id, reason);
      return NextResponse.json(result);
    }

    // Execute action
    if (!action_type) {
      return NextResponse.json({ error: 'action_type is required' }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const result = await executeControlAction(profile.tenant_id, user.id, action_type, parameters || {}, ipAddress);

    return NextResponse.json(result);

  } catch (error) {
    const { logger } = await import('@/lib/logger');
    logger.error('Control plane POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}