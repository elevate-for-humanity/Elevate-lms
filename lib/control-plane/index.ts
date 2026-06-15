/**
 * Unified Control Plane Service
 * 
 * Central command center for the entire Elevate platform.
 * Monitors and controls: website, LMS, admin, student, employer portals,
 * Supabase, Cloudflare, GitHub, deployments, AI agents, and workflows.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Lazy-initialized Supabase client - initialized on first use, not at module load
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null;

async function getSupabaseClient() {
  if (!_supabase) {
    const { createClient } = await import('@supabase/supabase-js');
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

// Platform Map - All connected systems
export interface PlatformService {
  id: string;
  service_name: string;
  service_type: string;
  url: string;
  provider: string;
  environment: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  uptime_percent: number;
  last_health_check: string | null;
  related_env_vars: string[];
}

export interface HealthCheck {
  service_id: string;
  service_name: string;
  status: 'pass' | 'fail' | 'warning';
  response_time_ms: number;
  error_message?: string;
  checked_at: string;
}

export interface ControlAction {
  action_type: string;
  target_service?: string;
  parameters?: Record<string, unknown>;
  requires_approval: boolean;
  description: string;
}

// Get platform map
export async function getPlatformMap(tenantId: string): Promise<{
  services: PlatformService[];
  total: number;
  healthy: number;
  degraded: number;
  down: number;
}> {
  const { data: services } = await getSupabaseClient()
    .from('platform_services')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('service_name');

  const mappedServices: PlatformService[] = (services || []).map(s => ({
    id: s.id,
    service_name: s.service_name,
    service_type: s.service_type,
    url: s.url,
    provider: s.provider,
    environment: s.environment,
    status: s.status,
    uptime_percent: s.uptime_percent,
    last_health_check: s.last_health_check,
    related_env_vars: s.related_env_vars || [],
  }));

  return {
    services: mappedServices,
    total: mappedServices.length,
    healthy: mappedServices.filter(s => s.status === 'healthy').length,
    degraded: mappedServices.filter(s => s.status === 'degraded').length,
    down: mappedServices.filter(s => s.status === 'down').length,
  };
}

// Health Monitor - Check all services
export async function checkAllHealth(tenantId: string): Promise<{
  checks: HealthCheck[];
  overall_status: 'healthy' | 'degraded' | 'down';
}> {
  const { data: services } = await getSupabaseClient()
    .from('platform_services')
    .select('*')
    .eq('tenant_id', tenantId);

  const checks: HealthCheck[] = [];
  const now = new Date().toISOString();

  for (const service of services || []) {
    try {
      const startTime = Date.now();
      const response = await fetch(service.url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      const responseTime = Date.now() - startTime;

      const status = response.ok ? 'pass' : response.status >= 500 ? 'fail' : 'warning';

      checks.push({
        service_id: service.id,
        service_name: service.service_name,
        status,
        response_time_ms: responseTime,
        checked_at: now,
      });

      // Update service status
      await getSupabaseClient()
        .from('platform_services')
        .update({ 
          status: status === 'pass' ? 'healthy' : status === 'warning' ? 'degraded' : 'down',
          last_health_check: now,
        })
        .eq('id', service.id);

      // Log health check
      await getSupabaseClient().from('platform_health_checks').insert({
        tenant_id: tenantId,
        service_id: service.id,
        check_type: 'uptime',
        status,
        response_time_ms: responseTime,
        status_code: response.status,
        checked_at: now,
      });
    } catch (error) {
      checks.push({
        service_id: service.id,
        service_name: service.service_name,
        status: 'fail',
        response_time_ms: 0,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        checked_at: now,
      });

      await getSupabaseClient()
        .from('platform_services')
        .update({ status: 'down', last_health_check: now })
        .eq('id', service.id);
    }
  }

  const hasFailures = checks.some(c => c.status === 'fail');
  const hasWarnings = checks.some(c => c.status === 'warning');

  return {
    checks,
    overall_status: hasFailures ? 'down' : hasWarnings ? 'degraded' : 'healthy',
  };
}

// Control Actions
const CONTROL_ACTIONS: Record<string, ControlAction> = {
  'cache_clear': {
    action_type: 'cache_clear',
    target_service: 'cloudflare',
    description: 'Clear Cloudflare CDN cache',
    requires_approval: false,
  },
  'rebuild': {
    action_type: 'rebuild',
    target_service: 'deployment',
    description: 'Trigger platform rebuild',
    requires_approval: true,
  },
  'restart': {
    action_type: 'restart',
    target_service: 'deployment',
    description: 'Restart deployment',
    requires_approval: true,
  },
  'rollback': {
    action_type: 'rollback',
    target_service: 'deployment',
    description: 'Rollback to previous version',
    requires_approval: true,
  },
  'qa_scan': {
    action_type: 'qa_scan',
    target_service: 'devstudio',
    description: 'Run QA auto-healing scan',
    requires_approval: false,
  },
  'gap_scan': {
    action_type: 'gap_scan',
    target_service: 'devstudio',
    description: 'Run course gap scan',
    requires_approval: false,
  },
  'course_generate': {
    action_type: 'course_generate',
    target_service: 'lms',
    description: 'Generate new course',
    requires_approval: false,
  },
  'env_update': {
    action_type: 'env_update',
    target_service: 'platform',
    description: 'Update environment variable',
    requires_approval: true,
  },
  'pr_create': {
    action_type: 'pr_create',
    target_service: 'github',
    description: 'Create GitHub Pull Request',
    requires_approval: false,
  },
};

// Execute control action
export async function executeControlAction(
  tenantId: string,
  userId: string,
  actionType: string,
  parameters: Record<string, unknown> = {},
  ipAddress?: string
): Promise<{
  success: boolean;
  action_id?: string;
  message: string;
  requires_approval?: boolean;
}> {
  const action = CONTROL_ACTIONS[actionType];
  if (!action) {
    return { success: false, message: `Unknown action: ${actionType}` };
  }

  // Create action record
  const { data: actionRecord, error } = await getSupabaseClient()
    .from('platform_control_actions')
    .insert({
      tenant_id: tenantId,
      action_type: actionType,
      target_service: action.target_service,
      parameters,
      status: action.requires_approval ? 'pending' : 'running',
      triggered_by: userId,
      requires_approval: action.requires_approval,
      ip_address: ipAddress,
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: 'Failed to create action record' };
  }

  // Log event
  await getSupabaseClient().from('platform_event_logs').insert({
    tenant_id: tenantId,
    event_type: 'control_action',
    event_category: actionType,
    severity: action.requires_approval ? 'warn' : 'info',
    title: `Control Action: ${actionType}`,
    description: action.description,
    actor_id: userId,
    metadata: { action_id: actionRecord.id, parameters },
    ip_address: ipAddress,
  });

  if (action.requires_approval) {
    return {
      success: true,
      action_id: actionRecord.id,
      message: 'Action requires approval before execution',
      requires_approval: true,
    };
  }

  // Execute action immediately
  try {
    const result = await executeAction(actionType, parameters);
    
    await getSupabaseClient()
      .from('platform_control_actions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result,
      })
      .eq('id', actionRecord.id);

    return { success: true, action_id: actionRecord.id, message: 'Action completed successfully' };
  } catch (error) {
    await getSupabaseClient()
      .from('platform_control_actions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', actionRecord.id);

    return { success: false, action_id: actionRecord.id, message: error instanceof Error ? error.message : 'Action failed' };
  }
}

// Execute specific action
async function executeAction(actionType: string, parameters: Record<string, unknown>): Promise<Record<string, unknown>> {
  switch (actionType) {
    case 'qa_scan':
      return await runQAScan();
    case 'gap_scan':
      return await runGapScan();
    case 'cache_clear':
      return await clearCloudflareCache();
    case 'pr_create':
      return await createGitHubPR(parameters);
    default:
      throw new Error(`No executor for action: ${actionType}`);
  }
}

async function runQAScan(): Promise<Record<string, unknown>> {
  try {
    const { runFullScan } = await import('@/lib/qa/auto-healing-agent');
    const { data: scan } = await getSupabaseClient().from('qa_scans').insert({
      tenant_id: 'default',
      scan_type: 'manual',
      triggered_by: 'control_plane',
    }).select().single();
    
    if (scan) {
      await runFullScan(scan.id, 'default');
    }
    
    return { scan_id: scan?.id, status: 'completed' };
  } catch (error) {
    throw new Error(`QA scan failed: ${error instanceof Error ? error.message : 'Unknown'}`, { cause: error });
  }
}

async function runGapScan(): Promise<Record<string, unknown>> {
  try {
    const { scanAllGaps } = await import('@/lib/ai/course-gap-detection');
    const result = await scanAllGaps();
    return { total_gaps: result.total_gaps, critical: result.critical_gaps };
  } catch (error) {
    throw new Error(`Gap scan failed: ${error instanceof Error ? error.message : 'Unknown'}`, { cause: error });
  }
}

async function clearCloudflareCache(): Promise<Record<string, unknown>> {
  const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!cloudflareToken) {
    throw new Error('Cloudflare API token not configured');
  }

  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/purge_cache', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudflareToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purge_everything: true }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Cache clear failed');
    }

    return { status: 'success', message: 'Cache cleared' };
  } catch (error) {
    throw new Error(`Cloudflare cache clear failed: ${error instanceof Error ? error.message : 'Unknown'}`, { cause: error });
  }
}

async function createGitHubPR(parameters: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Sanitize inputs to prevent command injection
  const sanitizedBranch = (parameters.branch as string || `fix/${Date.now()}`)
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
    .substring(0, 100);
  const title = (parameters.title as string || 'Control Plane Fix')
    .replace(/"/g, '\\"')
    .substring(0, 200);
  const description = ((parameters.description as string) || '')
    .replace(/"/g, '\\"')
    .substring(0, 5000);

  try {
    await execAsync(`git checkout -b ${sanitizedBranch}`);
    await execAsync('git add -A');
    await execAsync(`git commit -m "${title}"`);
    await execAsync(`git push origin ${sanitizedBranch}`);
    
    // Create PR via gh cli
    const { stdout } = await execAsync(
      `gh pr create --title "${title}" --body "${description}" --draft`
    );

    return { branch: sanitizedBranch, pr_url: stdout, status: 'created' };
  } catch (error) {
    throw new Error(`PR creation failed: ${error instanceof Error ? error.message : 'Unknown'}`, { cause: error });
  }
}

// Get platform logs
export async function getPlatformLogs(
  tenantId: string,
  options: {
    event_type?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ logs: unknown[]; total: number }> {
  let query = await getSupabaseClient()
    .from('platform_event_logs')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options.event_type) {
    query = query.eq('event_type', options.event_type);
  }
  if (options.severity) {
    query = query.eq('severity', options.severity);
  }

  const { data, count } = await query
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

  return { logs: data || [], total: count || 0 };
}

// Get integration status
export async function getIntegrations(tenantId: string): Promise<{
  integrations: unknown[];
  connected: number;
  disconnected: number;
}> {
  const { data } = await getSupabaseClient()
    .from('platform_integrations')
    .select('*')
    .eq('tenant_id', tenantId);

  const integrations = data || [];
  return {
    integrations,
    connected: integrations.filter((i: unknown) => (i as { status: string }).status === 'connected').length,
    disconnected: integrations.filter((i: unknown) => (i as { status: string }).status !== 'connected').length,
  };
}

// Approve control action
export async function approveAction(
  actionId: string,
  approverId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const { data: action } = await getSupabaseClient()
    .from('platform_control_actions')
    .select('*')
    .eq('id', actionId)
    .single();

  if (!action) {
    return { success: false, message: 'Action not found' };
  }

  if (action.approval_status === 'approved') {
    return { success: false, message: 'Action already approved' };
  }

  await getSupabaseClient()
    .from('platform_control_actions')
    .update({
      approval_status: 'approved',
      approved_by: approverId,
      approval_reason: reason,
      status: 'running',
    })
    .eq('id', actionId);

  // Execute the action
  try {
    const result = await executeAction(action.action_type, action.parameters || {});
    await getSupabaseClient()
      .from('platform_control_actions')
      .update({ status: 'completed', completed_at: new Date().toISOString(), result })
      .eq('id', actionId);

    return { success: true, message: 'Action approved and executed' };
  } catch (error) {
    await getSupabaseClient()
      .from('platform_control_actions')
      .update({ status: 'failed', completed_at: new Date().toISOString(), error_message: error instanceof Error ? error.message : 'Unknown' })
      .eq('id', actionId);

    return { success: false, message: 'Action failed: ' + (error instanceof Error ? error.message : 'Unknown') };
  }
}