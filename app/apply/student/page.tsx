import { Metadata } from 'next';
import StudentApplicationForm from './StudentApplicationForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { resolveSlug } from '@/lib/program-registry';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Student Application | Elevate for Humanity',
  description: 'Apply for workforce training and career development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/student',
  },
};

export default async function StudentApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const params = await searchParams;
  const initialProgram = resolveSlug(params?.program || '') || '';
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Student' }]} />
        </div>
      </div>

      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase mb-2">
            Student Application
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
            Start Your Career Journey
          </h1>
          <p className="text-base sm:text-lg text-black max-w-3xl">
            This application helps us understand your goals and match you with the right
            training program. Many programs have funding available through WIOA, WRG, and JRI grants.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <StudentApplicationForm initialProgram={initialProgram} />
      </section>
    </div>
  );
}
