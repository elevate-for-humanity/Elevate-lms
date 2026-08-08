import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Prestige Elevation Barber Curriculum | Apprentice Portal',
  robots: { index: false, follow: false },
};

export default async function ApprenticeCoursePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/course');
  }

  // One canonical course experience. The previous page was a disconnected
  // placeholder showing 0 videos / 0 hours even when the course was published.
  redirect('/lms/courses/barber-apprenticeship');
}
