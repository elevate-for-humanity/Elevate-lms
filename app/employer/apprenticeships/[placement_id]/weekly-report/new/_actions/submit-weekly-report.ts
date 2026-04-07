'use server';
import { createAdminClient } from '@/lib/supabase/admin';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function submitWeeklyReport(formData: FormData) {
  const supabase = await createClient();
  const db = createAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify employer role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'employer') {
    redirect('/unauthorized');
  }

  // Extract form data
  const placement_id = formData.get('placement_id') as string;
  const week_start = formData.get('week_start') as string;
  const week_end = formData.get('week_end') as string;
  const hours_ojt = parseFloat(formData.get('hours_ojt') as string);
  const hours_related = parseFloat(formData.get('hours_related') as string);
  const notes = formData.get('notes') as string;

  // Calculate total hours
  const hours_total = hours_ojt + hours_related;

  // Get placement and verify access
  const { data: placement } = await db
    .from('apprentice_placements')
    .select('shop_id')
    .eq('id', placement_id)
    .single();

  if (!placement) {
    throw new Error('Placement not found');
  }

  // Verify employer has access to this shop
  const { data: shopAccess } = await db
    .from('shop_staff')
    .select('shop_id')
    .eq('user_id', user.id)
    .eq('shop_id', placement.shop_id)
    .single();

  if (!shopAccess) {
    throw new Error('You do not have access to this placement');
  }

  // Create weekly report
  const { error: reportError } = await db
    .from('apprentice_weekly_reports')
    .insert({
      placement_id,
      week_start,
      week_end,
      hours_ojt,
      hours_related,
      hours_total,
      notes,
      submitted_by_user_id: user.id,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
    });

  if (reportError) {
    throw new Error('Failed to submit weekly report');
  }

  // Redirect to employer dashboard
  redirect('/employer/dashboard');
}
