'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createIncentive(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) throw new Error('Database unavailable');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const amount = formData.get('amount') as string;
  const employer = formData.get('employer') as string;
  const description = formData.get('description') as string;
  const start_date = formData.get('start_date') as string;
  const end_date = formData.get('end_date') as string;

  const { error } = await supabase.from('incentives').insert({
    name,
    type: type || 'tax_credit',
    amount: amount ? parseFloat(amount) : null,
    employer_name: employer || null,
    description: description || null,
    start_date: start_date || null,
    end_date: end_date || null,
    status: 'active',
    created_by: user.id,
  });

  if (error) throw new Error('Failed to process incentive action.');

  revalidatePath('/admin/incentives');
  redirect('/admin/incentives');
}
