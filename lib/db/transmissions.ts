import { createClient } from '@/lib/supabase/server';

export async function createPendingTransmission(input: {
  returnId: string;
  transmissionId: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transmission_statuses')
    .insert({
      return_id: input.returnId,
      transmission_id: input.transmissionId,
      ack_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveAckResult(input: {
  returnId: string;
  transmissionId: string;
  ackStatus: 'accepted' | 'rejected';
  ackCode?: string;
  ackMessage?: string;
  rawResponse?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transmission_statuses')
    .update({
      ack_status: input.ackStatus,
      ack_code: input.ackCode ?? null,
      ack_message: input.ackMessage ?? null,
      raw_response: input.rawResponse ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('transmission_id', input.transmissionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingTransmissions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transmission_statuses')
    .select('*')
    .eq('ack_status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getTransmissionsByReturnId(returnId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transmission_statuses')
    .select('*')
    .eq('return_id', returnId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
