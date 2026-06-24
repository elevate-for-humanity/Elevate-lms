import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FileText } from 'lucide-react';
import { ApplicationsClient } from './ApplicationsClient';

export const metadata: Metadata = {
  title: 'Applications | Employer Portal | Elevate For Humanity',
  description: 'Review and manage job applications from candidates.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/employer-portal/applications');
  }

  // Fetch real job applications
  const { data: jobApplications } = await supabase
    .from('job_applications')
    .select(`
      id,
      status,
      created_at,
      user_id,
      job_id,
      profiles!job_applications_user_id_fkey(full_name, city, state),
      jobs(title)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  const applications = jobApplications?.map((app: any) => {
    const createdAt = new Date(app.created_at);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - createdAt.getTime()) / 3600000);
    const diffDays = Math.floor(diffHours / 24);
    const appliedDate = diffHours < 24 ? `${diffHours} hours ago` : diffDays < 7 ? `${diffDays} days ago` : `${Math.floor(diffDays / 7)} weeks ago`;
    
    return {
      id: app.id,
      userId: app.user_id,
      candidate: {
        name: app.profiles?.full_name || 'Applicant',
        image: null,
      },
      position: app.jobs?.title || 'Position',
      status: app.status || 'New',
      appliedDate,
      rating: 0,
      location: app.profiles?.city && app.profiles?.state ? `${app.profiles.city}, ${app.profiles.state}` : 'Not specified',
    };
  }) || [];





  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Employer Portal', href: '/employer-portal' }, { label: 'Applications' }]} />
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-brand-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Applications</h1>
          </div>
          <p className="text-slate-700">Review and manage applications from candidates</p>
        </div>
      </section>
      <ApplicationsClient applications={applications} />
    </div>
  );
}
