'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function createCampaignAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = (formData.get('name') as string)?.trim();
  const campaign_type = (formData.get('campaign_type') as string) || 'email';
  const subject = (formData.get('subject') as string)?.trim() || null;
  const content = (formData.get('content') as string)?.trim() || null;
  const scheduled_at = (formData.get('scheduled_at') as string) || null;

  if (!name) return;

  await supabase.from('campaigns').insert({
    name,
    campaign_type,
    subject,
    content,
    scheduled_at: scheduled_at || null,
    status: scheduled_at ? 'scheduled' : 'draft',
    created_by: user.id,
  });

  redirect('/admin/crm/campaigns');
}
