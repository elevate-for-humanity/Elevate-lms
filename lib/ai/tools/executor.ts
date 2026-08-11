import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { getAIToolDefinition, type ElevateAgent } from '@/lib/ai/tools/registry';
import { logger } from '@/lib/logger';

export type AIToolActor = {
  id: string;
  roles: string[];
  tenantId?: string | null;
};

export type AIToolExecutionResult = {
  ok: boolean;
  tool: string;
  runId?: string;
  pendingApproval?: boolean;
  data?: unknown;
  error?: string;
};

function clampLimit(value: unknown, fallback = 25, max = 100): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), max) : fallback;
}

function roleAllowed(actor: AIToolActor, requiredRoles: string[]): boolean {
  if (actor.roles.includes('super_admin') || actor.roles.includes('admin')) return true;
  return actor.roles.some((role) => requiredRoles.includes(role));
}

function cleanSearch(value: unknown): string {
  return typeof value === 'string'
    ? value.replace(/[,%()]/g, ' ').trim().slice(0, 180)
    : '';
}

function safeIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function rate(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 100) / 100;
}

async function runImplementation(
  toolName: string,
  input: Record<string, unknown>,
  actor: AIToolActor,
) {
  const db: any = await requireAdminClient();

  switch (toolName) {
    case 'applications.search': {
      let query = db
        .from('applications')
        .select('id,first_name,last_name,full_name,email,phone,status,program_id,program_slug,program_interest,funding_status,funding_source,created_at,submitted_at,reviewed_at')
        .order('created_at', { ascending: false })
        .limit(clampLimit(input.limit));
      if (typeof input.status === 'string' && input.status) query = query.eq('status', input.status);
      const program = cleanSearch(input.program);
      if (program) query = query.or(`program_slug.ilike.%${program}%,program_interest.ilike.%${program}%`);
      const search = cleanSearch(input.query);
      if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return { applications: data ?? [], count: data?.length ?? 0 };
    }

    case 'applications.read': {
      const id = typeof input.id === 'string' ? input.id : '';
      if (!id) throw new Error('Application id is required.');
      const { data, error } = await db
        .from('applications')
        .select('id,first_name,last_name,full_name,email,phone,city,zip,status,program_id,program_slug,program_interest,funding_status,funding_source,review_notes,support_notes,created_at,submitted_at,reviewed_at')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Application not found.');
      return data;
    }

    case 'applications.updateStatus': {
      const id = typeof input.id === 'string' ? input.id : '';
      const status = typeof input.status === 'string' ? input.status : '';
      const allowedStatuses = new Set([
        'pending',
        'submitted',
        'in_review',
        'under_review',
        'pending_admin_review',
        'approved',
        'rejected',
        'enrolled',
      ]);
      if (!id || !allowedStatuses.has(status)) {
        throw new Error('Valid application id and status are required.');
      }
      const reviewNotes = typeof input.reviewNotes === 'string'
        ? input.reviewNotes.trim().slice(0, 4000)
        : null;
      const { data, error } = await db
        .from('applications')
        .update({
          status,
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: actor.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id,status,review_notes,reviewed_at,reviewed_by')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Application not found or update was not permitted.');
      return data;
    }

    case 'programs.search': {
      let query = db
        .from('programs')
        .select('id,slug,title,name,status,category,published,is_active,organization_id,tenant_id,created_at')
        .neq('status', 'archived')
        .order('title', { ascending: true })
        .limit(clampLimit(input.limit, 50));
      if (actor.tenantId && !actor.roles.includes('admin') && !actor.roles.includes('super_admin')) {
        query = query.eq('tenant_id', actor.tenantId);
      }
      const search = cleanSearch(input.query);
      if (search) query = query.or(`title.ilike.%${search}%,name.ilike.%${search}%,slug.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return { programs: data ?? [], count: data?.length ?? 0 };
    }

    case 'enrollments.search': {
      let query = db
        .from('program_enrollments')
        .select('id,user_id,student_id,full_name,email,program_id,program_slug,status,funding_status,funding_source,tenant_id,organization_id,created_at')
        .order('created_at', { ascending: false })
        .limit(clampLimit(input.limit));
      if (actor.tenantId && !actor.roles.includes('admin') && !actor.roles.includes('super_admin')) {
        query = query.eq('tenant_id', actor.tenantId);
      }
      if (typeof input.status === 'string' && input.status) query = query.eq('status', input.status);
      const program = cleanSearch(input.program);
      if (program) query = query.ilike('program_slug', `%${program}%`);
      const search = cleanSearch(input.query);
      if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return { enrollments: data ?? [], count: data?.length ?? 0 };
    }

    case 'wioa.followups.search': {
      let query = db
        .from('follow_ups')
        .select('id,participant_id,case_worker_id,type,due_date,status,notes,completed_at,created_at')
        .order('due_date', { ascending: true })
        .limit(clampLimit(input.limit, 50));

      const status = typeof input.status === 'string' ? input.status.trim() : '';
      if (status) query = query.eq('status', status);
      else query = query.neq('status', 'completed');

      const type = cleanSearch(input.type);
      if (type) query = query.ilike('type', `%${type}%`);

      const dueBefore = safeIsoDate(input.dueBefore);
      if (dueBefore) query = query.lte('due_date', dueBefore);
      else if (input.overdueOnly === true) query = query.lt('due_date', new Date().toISOString());

      const { data: followups, error } = await query;
      if (error) throw error;

      const participantIds = [...new Set((followups ?? []).map((row: any) => row.participant_id).filter(Boolean))];
      const caseWorkerIds = [...new Set((followups ?? []).map((row: any) => row.case_worker_id).filter(Boolean))];

      const participants = participantIds.length
        ? (await db
            .from('wioa_participants')
            .select('id,first_name,last_name,email,status,wioa_program,program_id,case_manager_id')
            .in('id', participantIds)).data ?? []
        : [];

      const participantCaseManagers = participants.map((row: any) => row.case_manager_id).filter(Boolean);
      const allManagerIds = [...new Set([...caseWorkerIds, ...participantCaseManagers])];
      const managers = allManagerIds.length
        ? (await db
            .from('case_managers')
            .select('id,name,agency,email')
            .in('id', allManagerIds)).data ?? []
        : [];

      const participantById = new Map(participants.map((row: any) => [row.id, row]));
      const managerById = new Map(managers.map((row: any) => [row.id, row]));

      const rows = (followups ?? []).map((followup: any) => {
        const participant = participantById.get(followup.participant_id) as any;
        const manager = managerById.get(followup.case_worker_id || participant?.case_manager_id) as any;
        return {
          ...followup,
          participant: participant
            ? {
                id: participant.id,
                name: [participant.first_name, participant.last_name].filter(Boolean).join(' '),
                email: participant.email,
                status: participant.status,
                wioaProgram: participant.wioa_program,
                programId: participant.program_id,
              }
            : null,
          caseManager: manager
            ? { id: manager.id, name: manager.name, agency: manager.agency, email: manager.email }
            : null,
          overdue: Boolean(followup.due_date && new Date(followup.due_date).getTime() < Date.now() && followup.status !== 'completed'),
        };
      });

      return { followups: rows, count: rows.length };
    }

    case 'wioa.performance.summary': {
      let query = db
        .from('wioa_participant_records')
        .select('participant_id,program_id,reporting_period_start,reporting_period_end,program_entry_date,program_exit_date,employed_q2_after_exit,employed_q4_after_exit,median_earnings_q2,credential_attained,measurable_skill_gain')
        .order('reporting_period_end', { ascending: false })
        .limit(clampLimit(input.limit, 250, 500));

      if (actor.tenantId) query = query.eq('tenant_id', actor.tenantId);
      if (typeof input.programId === 'string' && input.programId) query = query.eq('program_id', input.programId);
      if (typeof input.periodStart === 'string' && input.periodStart) query = query.gte('reporting_period_start', input.periodStart);
      if (typeof input.periodEnd === 'string' && input.periodEnd) query = query.lte('reporting_period_end', input.periodEnd);

      const { data: rows, error } = await query;
      if (error) throw error;
      const records = rows ?? [];
      const exited = records.filter((row: any) => Boolean(row.program_exit_date));
      const q2Eligible = exited.filter((row: any) => row.employed_q2_after_exit !== null);
      const q4Eligible = exited.filter((row: any) => row.employed_q4_after_exit !== null);
      const credentialEligible = exited.filter((row: any) => row.credential_attained !== null);
      const msgEligible = records.filter((row: any) => row.measurable_skill_gain !== null);
      const earnings = records
        .map((row: any) => Number(row.median_earnings_q2))
        .filter((value: number) => Number.isFinite(value) && value >= 0);

      const q2Employed = q2Eligible.filter((row: any) => row.employed_q2_after_exit === true).length;
      const q4Employed = q4Eligible.filter((row: any) => row.employed_q4_after_exit === true).length;
      const credentialAttained = credentialEligible.filter((row: any) => row.credential_attained === true).length;
      const skillGain = msgEligible.filter((row: any) => row.measurable_skill_gain === true).length;

      return {
        reporting: {
          records: records.length,
          exitedParticipants: exited.length,
          periodStart: input.periodStart ?? null,
          periodEnd: input.periodEnd ?? null,
          programId: input.programId ?? null,
        },
        outcomes: {
          employedQ2: { numerator: q2Employed, denominator: q2Eligible.length, ratePercent: rate(q2Employed, q2Eligible.length) },
          employedQ4: { numerator: q4Employed, denominator: q4Eligible.length, ratePercent: rate(q4Employed, q4Eligible.length) },
          credentialAttainment: { numerator: credentialAttained, denominator: credentialEligible.length, ratePercent: rate(credentialAttained, credentialEligible.length) },
          measurableSkillGain: { numerator: skillGain, denominator: msgEligible.length, ratePercent: rate(skillGain, msgEligible.length) },
          medianEarningsQ2: median(earnings),
        },
      };
    }

    case 'operations.alerts': {
      const { data, error } = await db
        .from('admin_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(clampLimit(input.limit, 25));
      if (error) throw error;
      return { alerts: data ?? [], count: data?.length ?? 0 };
    }

    default:
      throw new Error(`No executor implementation exists for ${toolName}.`);
  }
}

export async function executeAITool(params: {
  toolName: string;
  input?: Record<string, unknown>;
  agent: ElevateAgent;
  actor: AIToolActor;
  taskId?: string | null;
  correlationId?: string | null;
  approvedByHuman?: boolean;
  idempotencyKey?: string | null;
}): Promise<AIToolExecutionResult> {
  const definition = getAIToolDefinition(params.toolName);
  if (!definition) return { ok: false, tool: params.toolName, error: 'Unknown AI tool.' };
  if (!definition.allowedAgents.includes(params.agent)) {
    return { ok: false, tool: params.toolName, error: 'Agent is not authorized for this tool.' };
  }
  if (!roleAllowed(params.actor, definition.requiredRoles)) {
    return { ok: false, tool: params.toolName, error: 'User role is not authorized for this tool.' };
  }

  const db: any = await requireAdminClient();
  const input = params.input ?? {};
  const pendingApproval = definition.requiresApproval && !params.approvedByHuman;
  const { data: run, error: runError } = await db
    .from('ai_tool_runs')
    .insert({
      task_id: params.taskId ?? null,
      tool_name: params.toolName,
      actor_id: params.actor.id,
      tenant_id: params.actor.tenantId ?? null,
      risk_level: definition.risk,
      requires_approval: definition.requiresApproval,
      approval_status: pendingApproval ? 'pending' : definition.requiresApproval ? 'approved' : 'not_required',
      input,
      status: pendingApproval ? 'pending_approval' : 'running',
      idempotency_key: params.idempotencyKey ?? null,
      started_at: pendingApproval ? null : new Date().toISOString(),
    })
    .select('id')
    .maybeSingle();

  if (runError) {
    logger.error('[ai-tools] failed to create run record', runError, { toolName: params.toolName });
    return { ok: false, tool: params.toolName, error: 'Tool run could not be recorded.' };
  }

  if (pendingApproval) {
    return {
      ok: true,
      tool: params.toolName,
      runId: run?.id,
      pendingApproval: true,
      data: { message: 'Human approval is required before this write action can execute.' },
    };
  }

  try {
    const data = await Promise.race([
      runImplementation(params.toolName, input, params.actor),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI tool execution timed out.')), definition.timeoutMs),
      ),
    ]);

    if (run?.id) {
      await db
        .from('ai_tool_runs')
        .update({
          status: 'completed',
          output: data,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }

    return { ok: true, tool: params.toolName, runId: run?.id, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (run?.id) {
      await db
        .from('ai_tool_runs')
        .update({ status: 'failed', error: message, completed_at: new Date().toISOString() })
        .eq('id', run.id);
    }
    logger.error('[ai-tools] execution failed', error instanceof Error ? error : undefined, {
      toolName: params.toolName,
      runId: run?.id,
    });
    return { ok: false, tool: params.toolName, runId: run?.id, error: message };
  }
}

export async function approveAndExecuteAITool(params: {
  runId: string;
  approver: AIToolActor;
  agent: ElevateAgent;
}): Promise<AIToolExecutionResult> {
  if (!params.approver.roles.some((role) => role === 'admin' || role === 'super_admin')) {
    return { ok: false, tool: 'unknown', error: 'Administrator approval is required.' };
  }

  const db: any = await requireAdminClient();
  const { data: run, error } = await db
    .from('ai_tool_runs')
    .select('id,tool_name,input,status,approval_status,actor_id,tenant_id')
    .eq('id', params.runId)
    .maybeSingle();
  if (error || !run) return { ok: false, tool: 'unknown', error: 'Tool run not found.' };
  if (run.status !== 'pending_approval' || run.approval_status !== 'pending') {
    return { ok: false, tool: run.tool_name, runId: run.id, error: 'Tool run is not awaiting approval.' };
  }

  await db
    .from('ai_tool_runs')
    .update({ approval_status: 'approved', status: 'running', started_at: new Date().toISOString() })
    .eq('id', run.id)
    .eq('approval_status', 'pending');

  const definition = getAIToolDefinition(run.tool_name);
  if (!definition) return { ok: false, tool: run.tool_name, runId: run.id, error: 'Tool definition no longer exists.' };

  try {
    const data = await Promise.race([
      runImplementation(run.tool_name, run.input ?? {}, {
        id: run.actor_id || params.approver.id,
        roles: params.approver.roles,
        tenantId: run.tenant_id ?? params.approver.tenantId ?? null,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI tool execution timed out.')), definition.timeoutMs),
      ),
    ]);
    await db
      .from('ai_tool_runs')
      .update({ status: 'completed', output: data, completed_at: new Date().toISOString() })
      .eq('id', run.id);
    return { ok: true, tool: run.tool_name, runId: run.id, data };
  } catch (executionError) {
    const message = executionError instanceof Error ? executionError.message : String(executionError);
    await db
      .from('ai_tool_runs')
      .update({ status: 'failed', error: message, completed_at: new Date().toISOString() })
      .eq('id', run.id);
    return { ok: false, tool: run.tool_name, runId: run.id, error: message };
  }
}
