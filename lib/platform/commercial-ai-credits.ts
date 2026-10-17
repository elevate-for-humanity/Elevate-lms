import 'server-only';
import { randomUUID } from 'node:crypto';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { CommercialAgentId } from './commercial-ai-agents';
import { COMMERCIAL_AI_REPLY_COST } from './commercial-ai-usage-policy';

export class CommercialAiCreditsError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'CommercialAiCreditsError';
  }
}

export async function reserveCommercialAiReply(input: {
  tenantId: string;
  userId: string;
  agent: CommercialAgentId;
  idempotencyKey?: string | null;
}) {
  const key = input.idempotencyKey?.trim() || randomUUID();
  if (key.length > 200)
    throw new CommercialAiCreditsError('Invalid request key', 400, 'INVALID_REQUEST_KEY');
  const db = await requireAdminClient();
  const { data, error } = await db.rpc('consume_commercial_ai_reply_v1', {
    p_tenant_id: input.tenantId,
    p_user_id: input.userId,
    p_agent_id: input.agent,
    p_idempotency_key: key,
  });
  if (error)
    throw new CommercialAiCreditsError(
      'Usage verification is temporarily unavailable',
      503,
      'USAGE_UNAVAILABLE',
    );
  const row = Array.isArray(data) ? data[0] : data;
  if (row?.duplicate)
    throw new CommercialAiCreditsError(
      'This reply request has already been processed',
      409,
      'DUPLICATE_REQUEST',
    );
  if (!row?.success)
    throw new CommercialAiCreditsError(
      'Your assistant processing allowance is exhausted. Renew or upgrade to continue.',
      402,
      'INSUFFICIENT_CREDITS',
    );
  return { charged: COMMERCIAL_AI_REPLY_COST, balance: Number(row.balance ?? 0) };
}
