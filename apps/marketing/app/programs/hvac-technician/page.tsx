import HvacTrainingShowcase, { HvacLabHero } from '@/components/programs/HvacTrainingShowcase';
import { loadProgramForPage } from '@/lib/programs/load-program-page';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import heroBanners from '@/content/heroBanners';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 3600;

export default async function HvacTechnicianPage() {
  const loaded = await loadProgramForPage('hvac-technician');
  if (!loaded) return notFound();
  const p = loaded.program;
  const banner = heroBanners['hvac-technician'] ?? null;
  const heroBanner = banner?.primaryCta?.href?.includes('/apply')
    ? { ...banner, primaryCta: undefined }
    : banner;
  return (
    <>
      <ProgramDetailPage
        program={p}
        banner={heroBanner}
        heroOverride={<HvacLabHero />}
        visualContent={<HvacTrainingShowcase />}
      />
      <section aria-labelledby="hvac-syllabus" className="border-t border-slate-200 bg-white px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <h2 id="hvac-syllabus" className="text-2xl font-black text-slate-950">HVAC curriculum and syllabus</h2>
          <p className="mt-2 text-slate-700">See what you’ll cover during the six-week training program.</p>
          <div className="mt-4 flex flex-wrap gap-x-6">
            <Link href="/programs/hvac-technician/curriculum" className="inline-flex min-h-11 items-center font-bold text-brand-blue-800 underline">
              Preview the curriculum
            </Link>
            <Link href="/docs/syllabi/hvac-technician.md" className="inline-flex min-h-11 items-center font-bold text-brand-blue-800 underline">
              Open the six-week syllabus
            </Link>
          </div>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
              For HVAC contractors
            </p>
            <h2 className="mt-2 text-3xl font-black">Need technicians or an OJT partnership?</h2>
            <p className="mt-2 max-w-2xl leading-7 text-slate-200">
              Review the verified training path, employer responsibilities, candidate process, and
              regional partnership options.
            </p>
          </div>
          <Link
            href="/employers/hvac-partners"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3 font-black text-slate-950"
          >
            HVAC Employer Network
          </Link>
        </div>
      </section>
    </>
  );
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage('hvac-technician');
  if (!loaded) return { title: 'HVAC Technician' };
  const p = loaded.program;
  return {
    title: p.metaTitle ?? p.title ?? 'HVAC Technician',
    description: p.metaDescription ?? p.subtitle ?? '',
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/hvac-technician' },
  };
}
