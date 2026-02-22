'use server';
import { createAdminClient } from '@/lib/supabase/admin';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function createPlacement(formData: FormData) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
  const shop_id = formData.get('shop_id') as string;
  const student_email = formData.get('student_email') as string;
  const program_slug = formData.get('program_slug') as string;
  const start_date = formData.get('start_date') as string;
  const end_date = formData.get('end_date') as string;

  // Verify employer has access to this shop
  const { data: shopAccess } = await db
    .from('shop_staff')
    .select('shop_id')
    .eq('user_id', user.id)
    .eq('shop_id', shop_id)
    .single();

  if (!shopAccess) {
    throw new Error('You do not have access to this shop');
  }

  // Look up student by email
  const { data: student } = await db
    .from('profiles')
    .select('id')
    .eq('email', student_email)
    .eq('role', 'student')
    .single();

  if (!student) {
    throw new Error('Student not found with that email');
  }

  // Create apprentice placement
  const { data: placement, error: placementError } = await db
    .from('apprentice_placements')
    .insert({
      shop_id,
      student_id: student.id,
      program_slug,
      start_date,
      end_date: end_date || null,
      status: 'active',
      supervisor_user_id: user.id,
    })
    .select()
    .single();

  if (placementError || !placement) {
    throw new Error('Failed to create placement');
  }

  // Redirect to employer dashboard
  redirect('/employer/dashboard');
}
