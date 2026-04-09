import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import AICourseBuilderForm from './AICourseBuilderForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Course Builder | Admin | Elevate LMS',
  description: 'Generate a complete course draft from a prompt or syllabus.',
  robots: { index: false, follow: false },
};

export default async function AICourseBuilderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminDb = await getAdminClient();
  if (adminDb) {
    const { data: profile } = await adminDb
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || !['admin', 'super_admin', 'instructor'].includes(profile.role)) {
      redirect('/unauthorized');
    }
  }

  return <AICourseBuilderForm />;
}
