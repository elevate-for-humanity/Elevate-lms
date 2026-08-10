import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Book, Users, Award, Briefcase } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireRole } from '@/lib/auth/require-role';
import ProgramOrientationVideo from '@/components/student/ProgramOrientationVideo';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { loadVerifiedPublicStats } from '@/lib/site-stats-server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Program Orientation | Student Dashboard',
  description: 'Complete your program orientation to get started with your training.',
};

export default async function OrientationPage() {
  const verified = await loadVerifiedPublicStats();
  const { profile } = await requireRole(['student', 'admin', 'super_admin']);
  const typedProfile = profile as typeof profile & { orientation_completed?: boolean | null };
  const isCompleted = Boolean(typedProfile.orientation_completed);

  async function completeOrientation() {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    await supabase.from('profiles').update({ orientation_completed: true }).eq('id', user.id);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4"><Breadcrumbs items={[{ label: 'My Programs', href: '/lms/courses' }, { label: 'Orientation' }]} /></div>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8"><h1 className="mb-2 text-3xl font-bold text-black md:text-4xl">Program Orientation</h1><p className="text-lg text-black">{isCompleted ? 'You have completed your orientation. Review the video anytime.' : 'Watch this orientation video to get started with your training journey.'}</p></div>
        {isCompleted ? <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-6"><h2 className="font-bold text-green-900">Orientation Completed</h2><p className="mt-1 text-sm text-green-800">You can continue to your program and enrollment steps.</p></div> : null}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ProgramOrientationVideo title={`Welcome to ${PLATFORM_DEFAULTS.orgName}`} description="Learn about programs, expectations, and how to succeed in your training journey." videoUrl="/videos/orientation-full.mp4" onComplete={completeOrientation} />
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-black">What You'll Learn</h2>
              <ul className="space-y-3 text-black">
                <li>• How enrollment and verified funding pathways work</li>
                <li>• Available healthcare, skilled-trades, business, and apprenticeship programs</li>
                <li>• Support services and learner responsibilities</li>
                <li>• Career services and next steps after training</li>
              </ul>
            </section>
          </div>
          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-black">Next Steps</h2>
              <ol className="space-y-3 text-sm text-slate-700"><li>1. Complete orientation</li><li>2. Verify eligibility or payment path</li><li>3. Choose a program</li><li>4. Start training</li></ol>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-black">Quick Links</h2>
              <div className="space-y-2">
                <Link href="/lms/programs" className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-50"><Book className="h-5 w-5 text-brand-blue-600" />Browse Programs</Link>
                <Link href="/how-it-works" className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-50"><Users className="h-5 w-5 text-brand-blue-600" />How It Works</Link>
                <Link href="/programs" className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-50"><Award className="h-5 w-5 text-brand-blue-600" />Funding & Programs</Link>
                <Link href="/career-services" className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-50"><Briefcase className="h-5 w-5 text-brand-blue-600" />Career Services</Link>
              </div>
            </section>
            <section className="rounded-xl border border-brand-blue-200 bg-brand-blue-50 p-6"><h2 className="font-bold text-brand-blue-900">Need Help?</h2><p className="mt-2 text-sm text-brand-blue-800">Our team can help with enrollment, programs, and portal access.</p><Link href="/contact" className="mt-4 inline-flex rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-bold text-white">Contact Support</Link></section>
          </aside>
        </div>
        <p className="mt-8 text-sm text-slate-600">Current published program catalog: {verified.programsDisplay} programs.</p>
      </div>
    </main>
  );
}
