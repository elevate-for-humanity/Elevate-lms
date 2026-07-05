import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Auth guard — enrolled barber students only.
// Unauthenticated users are sent to login with a return redirect.
// Authenticated users without a barber enrollment are sent back to the program page.
export default async function PaymentSetupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/programs/barber-apprenticeship/payment-setup');
  }

  // Verify they have a barber enrollment
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, payment_status, enrollment_state')
    .eq('user_id', user.id)
    .eq('program_slug', 'barber-apprenticeship')
    .maybeSingle();

  if (!enrollment) {
    // No enrollment — send to apply page
    redirect('/programs/barber-apprenticeship/apply/apprentice');
  }

  if (enrollment.payment_status === 'paid' || enrollment.enrollment_state === 'active') {
    // Already paid — send to apprentice dashboard
    redirect('/apprentice');
  }

  return <>{children}</>;
}
