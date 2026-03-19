import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';


export const metadata: Metadata = {
  title: 'Learner Dashboard | Elevate for Humanity',
  description: 'Access your learner dashboard to track progress, complete courses, and manage your career training journey.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/learner' },
};

export default async function LearnerPage() {
  try {
    const supabase = await createClient();
    if (!supabase) { redirect("/login"); }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login?redirect=/lms/dashboard');
    }

    redirect('/lms/dashboard');
  } catch {
    redirect('/login?redirect=/lms/dashboard');
  }
}
