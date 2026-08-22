import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdaptiveLearningPath from '@/components/AdaptiveLearningPath';
import CompetencyTracking from '@/components/CompetencyTracking';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/adaptive' },
  title: 'Adaptive Learning',
  description: 'Personalized learning recommendations based on configured program, skill, and competency data.',
};

export default async function AdaptivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li>
                <Link href="/lms/dashboard" className="hover:text-brand-blue-700">
                  LMS
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-slate-900">Adaptive Learning</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Adaptive Learning</h1>
          <p className="mt-2 text-slate-700">
            Review learning paths generated from the programs, skills, and competencies actually configured for your account.
          </p>
        </div>

        <AdaptiveLearningPath />

        <section className="mt-8" aria-labelledby="competency-heading">
          <h2 id="competency-heading" className="sr-only">Competency progress</h2>
          <CompetencyTracking />
        </section>
      </div>
    </div>
  );
}
