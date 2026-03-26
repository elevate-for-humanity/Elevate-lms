import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AcknowledgeHandbookPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/employee/handbook/acknowledge');

  // Upsert acknowledgment
  await supabase.from('handbook_acknowledgments').upsert({
    user_id: user.id,
    handbook_version: new Date().getFullYear().toString(),
    acknowledged_at: new Date().toISOString(),
    full_acknowledgment: true,
    attendance_policy_ack: true,
    dress_code_ack: true,
    conduct_policy_ack: true,
    safety_policy_ack: true,
    grievance_policy_ack: true,
    acknowledgment_statement: 'I have read and understand the Elevate for Humanity Employee Handbook.',
    is_immutable: false,
  }, { onConflict: 'user_id' });

  redirect('/employee/handbook?acknowledged=1');
}
