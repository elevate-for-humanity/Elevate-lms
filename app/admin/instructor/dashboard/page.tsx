import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Instructor Dashboard | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export default async function InstructorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/instructor/dashboard');
  }

  // For now, instructors get redirected to admin dashboard
  // TODO: Create dedicated instructor dashboard with classes, students, grades
  redirect('/admin/dashboard');
}
