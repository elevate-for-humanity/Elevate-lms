export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function OrientationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?redirect=/programs/nail-technician-apprenticeship/orientation');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/programs/nail-technician-apprenticeship/orientation');
  }

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status, orientation_completed_at, programs(slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!enrollment) {
    redirect('/programs/nail-technician-apprenticeship');
  }

  if (!['confirmed', 'paid', 'orientation_complete', 'documents_complete', 'active'].includes(enrollment.status)) {
    redirect('/programs/nail-technician-apprenticeship');
  }

  if (enrollment.orientation_completed_at) {
    redirect('/programs/nail-technician-apprenticeship/documents');
  }

  return <>{children}</>;
}
