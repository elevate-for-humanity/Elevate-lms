'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitSupportRequest(formData: FormData) {
  // Use session client — RLS enforces row ownership on support_tickets.
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth failed: ${authError.message}`);
  if (!user) return { error: 'Not authenticated' };

  const subject = formData.get('subject') as string;
  const category = formData.get('category') as string;
  const message = formData.get('message') as string;
  const priority = formData.get('priority') as string || 'normal';

  if (!subject || !message) {
    return { error: 'Subject and message are required' };
  }

  const { error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      subject,
      category,
      message,
      priority,
      status: 'open',
      created_at: new Date().toISOString(),
    });

  if (error) {
    return { error: `Support ticket creation failed: ${error.message}` };
  }

  revalidatePath('/lms/support');
  return { success: true, message: 'Support ticket created successfully!' };
}
