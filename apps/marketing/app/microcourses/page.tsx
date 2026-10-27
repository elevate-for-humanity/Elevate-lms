import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/server';
import MicrocourseCart, { type CatalogMicrocourse } from './MicrocourseCart';

export const metadata: Metadata = {
  title: 'Microcourses | Elevate for Humanity',
  description: 'Short, employer-recognized courses from approved third-party certifiers.',
};

export const revalidate = 300;

type PublicCatalogRow = Omit<CatalogMicrocourse, 'microcourse_providers'> & {
  provider_display_name: string;
};

export default async function MicrocoursesPage() {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('get_public_microcourse_catalog');

  const courses = ((data || []) as PublicCatalogRow[]).map(
    ({ provider_display_name, ...course }) => ({
      ...course,
      microcourse_providers: { display_name: provider_display_name },
    }),
  );

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="font-semibold uppercase tracking-[0.2em] text-blue-700">Third-party certifications</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">Microcourses</h1>
        <p className="mt-5 max-w-3xl text-lg text-slate-600">
          Start free workforce-readiness courses or buy short courses from verified providers. Every displayed amount is validated against its active Stripe Price before checkout.
        </p>
        {error ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">The catalog could not be loaded. No placeholder courses are being shown.</div>
        ) : courses.length ? (
          <div className="mt-10"><MicrocourseCart courses={courses} /></div>
        ) : (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-bold">Catalog setup in progress</h2>
            <p className="mt-2 text-slate-600">Courses appear here only after the provider, Stripe Product, Stripe Price, and transfer capability are verified.</p>
          </div>
        )}
      </div>
    </main>
  );
}
