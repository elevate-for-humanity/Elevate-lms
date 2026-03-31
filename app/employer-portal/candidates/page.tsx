import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { CandidatesClient } from './CandidatesClient';

export const metadata: Metadata = {
  title: 'Candidates | Employer Portal | Elevate For Humanity',
  description: 'Browse and connect with qualified candidates from our training programs.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CandidatesPage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/employer-portal/candidates');
  }

  // Fetch real candidates from completed enrollments
  const { data: completedEnrollments } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      user_id,
      progress,
      created_at,
      profiles!enrollments_user_id_fkey(id, full_name, bio, city, state),
      programs(name)
    `)
    .eq('progress', 100)
    .order('created_at', { ascending: false })
    .limit(20);

  const candidates = completedEnrollments?.map((e: any) => ({
    id: e.user_id,
    name: e.profiles?.full_name || 'Graduate',
    title: e.programs?.name ? `${e.programs.name} Graduate` : 'Program Graduate',
    location: e.profiles?.city && e.profiles?.state ? `${e.profiles.city}, ${e.profiles.state}` : 'Location not specified',
    experience: 'Recent Graduate',
    skills: [],
    rating: 0,
    available: true,
    image: null,
    program: e.programs?.name || 'Training Program',
    graduated: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  })) || [];

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Employer Portal', href: '/employer-portal' }, { label: 'Candidates' }]} />
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/pages/employer-portal-page-1.jpg" alt="Candidates" fill className="object-cover"  sizes="100vw" />
      </section>

      <CandidatesClient candidates={candidates} />
    </div>
  );
}
