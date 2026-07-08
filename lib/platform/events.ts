/**
 * Platform Event Bus
 *
 * Emit structured events to platform_events table.
 * Supabase Realtime broadcasts these to the Command Center dashboard.
 *
 * Usage:
 *   import { emitEvent } from '@/lib/platform/events';
 *   await emitEvent('student.enrolled', 'enrollment', { subject_id: enrollmentId, ... });
 *
 * Event type conventions:
 *   <subject>.<verb>   e.g. student.enrolled, program.published, deployment.failed
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export type EventCategory =
  | 'lms'
  | 'enrollment'
  | 'deployment'
  | 'payment'
  | 'auth'
  | 'ai'
  | 'compliance'
  | 'program'
  | 'migration'
  | 'system';

export type EventSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface EmitEventOptions {
  severity?: EventSeverity;
  actor_id?: string;
  actor_type?: 'user' | 'system' | 'ai' | 'cron';
  subject_id?: string;
  subject_type?: string;
  payload?: Record<string, unknown>;
  message?: string;
}

/**
 * Emit a platform event. Fire-and-forget safe — never throws.
 */
export async function emitEvent(
  event_type: string,
  category: EventCategory,
  options: EmitEventOptions = {},
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('platform_events').insert({
      event_type,
      category,
      severity: options.severity ?? 'info',
      actor_id: options.actor_id ?? null,
      actor_type: options.actor_type ?? 'system',
      subject_id: options.subject_id ?? null,
      subject_type: options.subject_type ?? null,
      payload: options.payload ?? {},
      message: options.message ?? null,
    });
    if (error) {
      logger.warn('[platform/events] emit failed', { event_type, error: error.message });
    }
  } catch (err) {
    // Never let event emission crash the caller
    logger.warn('[platform/events] emit threw', { event_type, err });
  }
}

/**
 * Emit a deployment event (pre-built convenience wrapper).
 */
export async function emitDeploymentEvent(
  status: 'started' | 'succeeded' | 'failed' | 'rolled_back',
  details: { service?: string; version?: string; actor_id?: string; error?: string },
): Promise<void> {
  await emitEvent(`deployment.${status}`, 'deployment', {
    severity: status === 'failed' ? 'error' : status === 'rolled_back' ? 'warning' : 'info',
    actor_id: details.actor_id,
    actor_type: 'ai',
    subject_type: 'deployment',
    payload: details,
    message: `Deployment ${status}${details.service ? ` (${details.service})` : ''}${details.error ? `: ${details.error}` : ''}`,
  });
}

/**
 * Emit a migration event.
 */
export async function emitMigrationEvent(
  status: 'applied' | 'failed' | 'dry_run',
  filename: string,
  actor_id?: string,
): Promise<void> {
  await emitEvent(`migration.${status}`, 'migration', {
    severity: status === 'failed' ? 'error' : 'info',
    actor_id,
    actor_type: 'ai',
    subject_id: filename,
    subject_type: 'migration',
    message: `Migration ${status}: ${filename}`,
  });
}

/**
 * Emit an AI action event (audit trail).
 */
export async function emitAiAction(
  tool: string,
  actor_id: string | undefined,
  payload?: Record<string, unknown>,
): Promise<void> {
  await emitEvent('ai.tool_called', 'ai', {
    severity: 'info',
    actor_id,
    actor_type: 'ai',
    subject_type: 'tool',
    subject_id: tool,
    payload: { tool, ...payload },
    message: `AI tool called: ${tool}`,
  });
}

/**
 * Get recent events for the Command Center dashboard.
 * Returns last N events, optionally filtered by category or severity.
 */
export async function getRecentEvents(options: {
  limit?: number;
  category?: EventCategory;
  severity?: EventSeverity;
  since?: Date;
} = {}): Promise<Array<{
  id: string;
  event_type: string;
  category: string;
  severity: string;
  message: string | null;
  created_at: string;
  payload: Record<string, unknown>;
}>> {
  try {
    const supabase = createAdminClient();
    let q = supabase
      .from('platform_events')
      .select('id, event_type, category, severity, message, created_at, payload')
      .order('created_at', { ascending: false })
      .limit(options.limit ?? 50);

    if (options.category) q = q.eq('category', options.category) as typeof q;
    if (options.severity) q = q.eq('severity', options.severity) as typeof q;
    if (options.since) q = q.gte('created_at', options.since.toISOString()) as typeof q;

    const { data, error } = await q;
    if (error) {
      logger.warn('[platform/events] getRecentEvents failed', { error: error.message });
      return [];
    }
    return (data ?? []) as Array<{
      id: string;
      event_type: string;
      category: string;
      severity: string;
      message: string | null;
      created_at: string;
      payload: Record<string, unknown>;
    }>;
  } catch {
    return [];
  }
}
