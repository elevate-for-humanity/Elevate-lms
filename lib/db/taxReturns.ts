import { createClient } from '@/lib/supabase/server';
import type { Return1040, ReturnLifecycleStatus } from '@/lib/tax/domain/types';

export async function createTaxReturn(input: {
  taxYear: number;
  clientId: string;
  firmId?: string;
  createdByUserId: string;
  returnData: Return1040;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tax_returns')
    .insert({
      tax_year: input.taxYear,
      client_id: input.clientId,
      firm_id: input.firmId ?? null,
      status: input.returnData.metadata.status,
      return_json: input.returnData,
      created_by_user_id: input.createdByUserId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTaxReturnById(returnId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tax_returns')
    .select('*')
    .eq('id', returnId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaxReturnStatus(
  returnId: string,
  status: ReturnLifecycleStatus,
  actorUserId?: string
) {
  const supabase = await createClient();

  // Get current status for event log
  const { data: current } = await supabase
    .from('tax_returns')
    .select('status')
    .eq('id', returnId)
    .single();

  const { data, error } = await supabase
    .from('tax_returns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', returnId)
    .select()
    .single();

  if (error) throw error;

  // Write immutable event
  await supabase.from('tax_return_events').insert({
    return_id: returnId,
    actor_user_id: actorUserId ?? null,
    event_type: 'status_transition',
    from_status: current?.status ?? null,
    to_status: status,
  });

  return data;
}

export async function updateTaxReturnJson(
  returnId: string,
  returnJson: Return1040,
  actorUserId?: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tax_returns')
    .update({ return_json: returnJson, updated_at: new Date().toISOString() })
    .eq('id', returnId)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('tax_return_events').insert({
    return_id: returnId,
    actor_user_id: actorUserId ?? null,
    event_type: 'return_updated',
  });

  return data;
}

export async function listTaxReturns(filters?: {
  status?: ReturnLifecycleStatus;
  taxYear?: number;
  clientId?: string;
  firmId?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('tax_returns')
    .select('id, tax_year, status, client_id, firm_id, preparer_user_id, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.taxYear) query = query.eq('tax_year', filters.taxYear);
  if (filters?.clientId) query = query.eq('client_id', filters.clientId);
  if (filters?.firmId) query = query.eq('firm_id', filters.firmId);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
