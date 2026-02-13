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
    redirect('/login?redirect=/programs/barber-apprenticeship/orientation');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/programs/barber-apprenticeship/orientation');
  }

  // Verify user has an enrollment for this program
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status, orientation_completed_at, programs(slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // No enrollment - redirect to program page
  if (!enrollment) {
    redirect('/programs/barber-apprenticeship');
  }

  // Must be confirmed (paid) to access orientation
  if (!['confirmed', 'paid', 'orientation_complete', 'documents_complete', 'active'].includes(enrollment.status)) {
    redirect('/programs/barber-apprenticeship');
  }

  // Already completed orientation - redirect to documents
  if (enrollment.orientation_completed_at) {
    redirect('/programs/barber-apprenticeship/documents');
  }

  return <>{children}</>;
}
