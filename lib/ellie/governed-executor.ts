import type { SupabaseClient } from '@supabase/supabase-js';

import type { EllieActionType } from './actions';
import { assertActionPolicy, type ActionExecutionContext } from './action-policy';
import { executeEllieAction } from './executor';

export async function executeGovernedEllieAction(
  actionType: EllieActionType,
  params: Record<string, unknown>,
  db: SupabaseClient,
  context: ActionExecutionContext,
) {
  const policy = assertActionPolicy(actionType, context);
  const result = await executeEllieAction(actionType, params, db);
  return { ...result, policy: policy.policy, policyReason: policy.reason };
}
