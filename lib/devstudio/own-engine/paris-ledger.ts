/**
 * lib/devstudio/own-engine/paris-ledger.ts
 *
 * Supabase-backed PARIS ledger for the own-engine loop. Server-only.
 *
 * Approval gate: a repair runs only when
 *   1. paris_autopilot_policy (singleton row, id = true) is enabled, and
 *   2. the named paris_code_repairs row exists, belongs to the requesting
 *      admin, and is in a workable status (queued / dispatched / patching).
 * Anything else fails closed with OWN_ENGINE_APPROVAL_REQUIRED.
 *
 * Recording: each attempt is written to the same row — candidate carries the
 * latest own-engine file list, verification carries the attempt history and
 * the draft PR + CI state, error_code carries the terminal failure. Status
 * moves queued -> patching on start, patching -> validating when the draft
 * PR is open (CI is the validation), and patching -> blocked when attempts
 * are exhausted. This reuses the existing ledger columns; no migration.
 */

import 'server-only';

import { createHash, randomUUID } from 'node:crypto';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { OwnEngineLedger } from './agent-loop';

const WORKABLE_STATUSES = ['queued', 'dispatched', 'patching'];

async function policyEnabled(db: Awaited<ReturnType<typeof requireAdminClient>>): Promise<boolean> {
  const { data, error } = await db
    .from('paris_autopilot_policy')
    .select('enabled')
    .eq('id', true)
    .maybeSingle();
  if (error) throw error;
  return data?.enabled === true;
}

export async function createOwnEngineRepair(input: {
  goal: string;
  actorId: string;
  branch: string;
}): Promise<string> {
  const db = await requireAdminClient();
  if (!(await policyEnabled(db))) {
    throw new Error('OWN_ENGINE_APPROVAL_REQUIRED');
  }
  const fingerprint = createHash('sha256')
    .update(`${input.goal}\n${input.branch}\n${input.actorId}\n${randomUUID()}`)
    .digest('hex');
  const { data, error } = await db
    .from('paris_code_repairs')
    .insert({
      actor_id: input.actorId,
      fingerprint,
      goal: input.goal,
      status: 'queued',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export function createParisOwnEngineLedger(): OwnEngineLedger {
  return {
    async verifyApproval({ repairId, actorId }) {
      const db = await requireAdminClient();
      if (!(await policyEnabled(db))) {
        throw new Error('OWN_ENGINE_APPROVAL_REQUIRED');
      }
      const { data, error } = await db
        .from('paris_code_repairs')
        .select('id, actor_id, status')
        .eq('id', repairId)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.actor_id !== actorId || !WORKABLE_STATUSES.includes(data.status)) {
        throw new Error('OWN_ENGINE_APPROVAL_REQUIRED');
      }
    },

    async recordAttempt({ repairId, attempt, outcome, files, summary, provider, prNumber, prUrl, checks, errorCode, terminal }) {
      const db = await requireAdminClient();
      const values: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (outcome === 'started') {
        values.status = 'patching';
      } else if (outcome === 'succeeded') {
        values.status = 'validating';
        values.candidate = {
          kind: 'own-engine',
          attempt,
          provider,
          files: files?.map((file) => ({ path: file.path, chars: file.content.length })),
          summary: summary ?? null,
        };
        values.verification = {
          engine: 'own-engine',
          provider,
          attempt,
          pullRequest: prNumber ? { number: prNumber, url: prUrl } : null,
          checks: checks ?? null,
        };
        values.error_code = null;
      } else if (terminal) {
        // Only a terminal failure blocks the row; intermediate retries keep
        // it patching so a later attempt can still succeed.
        values.status = 'blocked';
        values.error_code = (errorCode ?? 'OWN_ENGINE_ATTEMPT_FAILED').slice(0, 500);
        values.verification = {
          engine: 'own-engine',
          provider,
          attempt,
          error: (errorCode ?? 'OWN_ENGINE_ATTEMPT_FAILED').slice(0, 500),
        };
      } else {
        values.verification = {
          engine: 'own-engine',
          provider,
          attempt,
          error: (errorCode ?? 'OWN_ENGINE_ATTEMPT_FAILED').slice(0, 500),
        };
      }
      const { error } = await db.from('paris_code_repairs').update(values).eq('id', repairId);
      if (error) throw error;
    },
  };
}
