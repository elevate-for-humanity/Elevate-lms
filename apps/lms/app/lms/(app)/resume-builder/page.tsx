import { createClient } from '@/lib/supabase/server';
import type { ComponentProps } from 'react';
import { requireRole } from '@/lib/auth/require-role';
import { ResumeBuilderPage } from './ResumeBuilderPage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Resume Builder', robots: { index: false, follow: false } };

export default async function Page() {
  const { user } = await requireRole([
    'student',
    'learner',
    'apprentice',
    'barber_apprentice',
    'cosmetology_apprentice',
    'admin',
    'staff',
  ]);
  const db = await createClient();
  const { data: saved, error } = await db
    .from('resumes')
    .select('resume_data')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Your saved resume could not be loaded. Please try again.');
  const initialData =
    saved?.resume_data && typeof saved.resume_data === 'object' && !Array.isArray(saved.resume_data)
      ? (saved.resume_data as ComponentProps<typeof ResumeBuilderPage>['initialData'])
      : undefined;
  return <ResumeBuilderPage initialData={initialData} />;
}
