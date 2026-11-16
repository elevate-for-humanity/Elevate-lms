'use server';

import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';

export interface NewEmployee {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
}

export async function listEmployees() {
  await requireRole(['admin']);
  const db = await requireAdminClient();
  const { data, error } = await db.from('employees').select('*').order('last_name');
  if (error) throw new Error('Employees could not load.');
  return data ?? [];
}

export async function createEmployee(form: NewEmployee) {
  await requireRole(['admin']);
  const db = await requireAdminClient();
  const { error } = await db.from('employees').insert({ ...form, status: 'active' });
  return { error: error ? 'The employee could not be created.' : null };
}
