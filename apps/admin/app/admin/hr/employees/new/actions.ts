'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export async function createEmployeeAction(formData: FormData) {
  await requireRole(['admin']);
  const supabase = await createClient();

  const first_name = (formData.get('first_name') as string)?.trim();
  const last_name = (formData.get('last_name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const department = (formData.get('department') as string) || null;
  const role = (formData.get('role') as string) || 'staff';
  const hire_date = (formData.get('hire_date') as string) || new Date().toISOString().slice(0, 10);

  if (!first_name || !last_name || !email) return;

  await supabase.from('employees').insert({
    first_name,
    last_name,
    email,
    department,
    role,
    hire_date,
    employment_status: 'active',
  });

  redirect('/admin/hr/employees');
}
