/**
 * Unified Control Plane Service
 * 
 * Central command center for the entire Elevate platform.
 * Monitors and controls: website, LMS, admin, student, employer portals,
 * Supabase, Cloudflare, GitHub, deployments, AI agents, and workflows.
 */

import { probePlatformService } from './service-probe';
import { exec } from 'child_process';
import { promisify } from 'util';
import { setAuditContext } from '@/lib/audit-context';
import { purgeCloudflareCache } from './cloudflare';

const execAsync = promisify(exec);

// Lazy-initialized Supabase client - initialized on first use, not at module load
 
let _supabase: any = null;

async function getSupabaseClient(): Promise<any> {
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

function inventoryScope(tenantId: string | null): string {
  if (tenantId === null) return 'tenant_id.is.null';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) throw new Error('Valid tenant identity required');
  return `tenant_id.is.null,tenant_id.eq.${tenantId}`;
}

// Get platform map
export async function getPlatformMap(tenantId: string): Promise<{
  services: PlatformService[];
  total: number;
  healthy: number;
  degraded: number;
  down: number;
}> {
  const { data: services, error } = await (await getSupabaseClient())
    .from('platform_services')
    .select('*')
    .or(inventoryScope(tenantId))
    .order('service_name');
  if (error) throw new Error('Platform service inventory is unavailable');

  const mappedServices: PlatformService[] = (services || []).map(s => ({
    id: s.id,
    service_name: s.service_name,
    service_type: s.service_type,
    url: s.url,
    provider: s.provider,
    environment: s.environment,
    status: s.last_health_check && Date.parse(s.last_health_check) <= Date.now() && Date.now() - Date.parse(s.last_health_check) < 10 * 60 * 1000 ? s.status : 'unknown',
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

// Health evidence is recorded for failed and unverified checks as well as passes.
export async function checkAllHealth(tenantId: string | null): Promise<{
  checks: HealthCheck[];
  overall_status: 'healthy' | 'degraded' | 'down';
}> {
  const db = await getSupabaseClient();
  const { data: services, error } = await db.from('platform_services').select('*').or(inventoryScope(tenantId));
  if (error) throw new Error('Platform service inventory is unavailable');
  const results = await Promise.allSettled((services || []).map(async (service: any) => {
    const result = await probePlatformService(service);
    const { error: receiptError } = await db.from('platform_health_checks').insert({
      ...result, tenant_id: service.tenant_id, service_id: service.id, check_type: 'api',
    });
    if (receiptError) throw new Error('Platform health receipt could not be saved');
    const { error: updateError } = await db.from('platform_services').update({
      status: result.status === 'pass' ? 'healthy' : result.status === 'fail' ? 'down' : 'unknown',
      last_health_check: result.checked_at,
    }).eq('id', service.id);
    if (updateError) throw new Error('Platform health status could not be saved');
    return { ...result, service_id: service.id, service_name: service.service_name };
  }));
  const checks: HealthCheck[] = [];
  for (const result of results) {
    if (result.status === 'rejected') throw new Error('Platform health persistence failed');
    checks.push(result.value);
  }
  return { checks, overall_status: !checks.length ? 'degraded' : checks.some(c => c.status === 'fail') ? 'down'
    : checks.some(c => c.status === 'warning') ? 'degraded' : 'healthy' };
}

// Control Actions
const CONTROL_ACTIONS: Record<string, ControlAction> = {
  'workflow_repair': {
    action_type: 'workflow_repair',
    target_service: 'devstudio',
    description: 'Queue an approved portal workflow diagnostic for verified PARIS code repair',
    requires_approval: true,
  },
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
  const { data: actionRecord, error } = await (await getSupabaseClient())
    .from('platform_control_actions')
    .insert({
      tenant_id: tenantId,
      action_type: actionType,
      target_service: action.target_service,
      parameters,
      status: action.requires_approval ? 'pending' : 'running',
      triggered_by: userId,
      requires_approval: action.requires_approval,
      ...(actionType === 'workflow_repair' ? {approval_status: 'pending'} : {}),
      ip_address: ipAddress,
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: 'Failed to create action record' };
  }

  // Log event
  await (await getSupabaseClient()).from('platform_event_logs').insert({
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
    
    await (await getSupabaseClient())
      .from('platform_control_actions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result,
      })
      .eq('id', actionRecord.id);

    return { success: true, action_id: actionRecord.id, message: 'Action completed successfully' };
  } catch (error) {
    await (await getSupabaseClient())
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
    const { data: scan } = await (await getSupabaseClient()).from('qa_scans').insert({
      tenant_id: 'default',
      scan_type: 'manual',
      triggered_by: 'control_plane',
    }).select().single();
    
    if (scan) {
      await runFullScan(scan.id, 'default');
    }
    
    return { scan_id: scan?.id, status: 'completed' };
  } catch (error) {
    const e = new Error(`QA scan failed: ${error instanceof Error ? error.message : 'Unknown'}`); (e as { cause?: unknown }).cause = error; throw e;
  }
}

async function runGapScan(): Promise<Record<string, unknown>> {
  try {
    const { scanAllGaps } = await import('@/lib/ai/course-gap-detection');
    const result = await scanAllGaps();
    return { total_gaps: result.total_gaps, critical: result.critical_gaps };
  } catch (error) {
    const e = new Error(`Gap scan failed: ${error instanceof Error ? error.message : 'Unknown'}`); (e as { cause?: unknown }).cause = error; throw e;
  }
}

async function clearCloudflareCache(): Promise<Record<string, unknown>> {
  return purgeCloudflareCache();
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
    const e = new Error(`PR creation failed: ${error instanceof Error ? error.message : 'Unknown'}`); (e as { cause?: unknown }).cause = error; throw e;
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
  let query = await (await getSupabaseClient())
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

// Read shared runtime observations as well as the tenant's integrations.
export async function getIntegrations(tenantId: string): Promise<{
  integrations: unknown[]; connected: number; disconnected: number;
}> {
  const { data, error } = await (await getSupabaseClient()).from('platform_integrations')
    .select('*').or(inventoryScope(tenantId));
  if (error) throw new Error('Integration inventory is unavailable');
  const integrations = (data || []).map((row: any) => {
    const checked = Date.parse(row.metadata?.checked_at || '');
    const fresh = Number.isFinite(checked) && checked <= Date.now() && Date.now() - checked < 600_000;
    return { ...row, status: row.status === 'connected' && !fresh ? 'testing' : row.status };
  });
  return { integrations, connected: integrations.filter((row: any) => row.status === 'connected').length,
    disconnected: integrations.filter((row: any) => row.status !== 'connected').length };
}

// Approve control action
export async function approveAction(
  actionId: string,
  approverId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const { data: action } = await (await getSupabaseClient())
    .from('platform_control_actions')
    .select('*')
    .eq('id', actionId)
    .single();

  if (!action) {
    return { success: false, message: 'Action not found' };
  }

  if (action.action_type === 'workflow_repair') {
    const db = await getSupabaseClient();
    const {data: profile, error} = await db.from('profiles').select('role,tenant_id')
      .eq('id', approverId).maybeSingle();
    if (error || !profile) return {success: false, message: 'Administrator identity could not be verified.'};
    try {
      await setAuditContext(db, { actorUserId: approverId, systemActor: 'control_plane_workflow_approval' });
      const {approveWorkflowRepair} = await import('./workflow-repairs');
      const repair = await approveWorkflowRepair(db, actionId, {
        actorId: approverId, actorRoles: [profile.role], tenantId: profile.tenant_id ?? null,
      });
      return {
        success: true,
        message: repair.verified
          ? `Code repair ${repair.repairId} was verified; the affected workflow still needs a user retry.`
          : `Workflow repair ${repair.repairId} is ${repair.status}; completion is not yet verified.`,
      };
    } catch {
      return {success: false, message: 'Workflow repair approval could not be completed.'};
    }
  }

  if (action.approval_status === 'approved') {
    return { success: false, message: 'Action already approved' };
  }

  await (await getSupabaseClient())
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
    await (await getSupabaseClient())
      .from('platform_control_actions')
      .update({ status: 'completed', completed_at: new Date().toISOString(), result })
      .eq('id', actionId);

    return { success: true, message: 'Action approved and executed' };
  } catch (error) {
    await (await getSupabaseClient())
      .from('platform_control_actions')
      .update({ status: 'failed', completed_at: new Date().toISOString(), error_message: error instanceof Error ? error.message : 'Unknown' })
      .eq('id', actionId);

    return { success: false, message: 'Action failed: ' + (error instanceof Error ? error.message : 'Unknown') };
  }
}
