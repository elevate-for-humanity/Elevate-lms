import { loadProgramForPage } from '@/lib/programs/load-program-page';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import heroBanners from '@/content/heroBanners';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 3600;

export default async function CdlTrainingPage() {
  const loaded = await loadProgramForPage('cdl-training');
  if (!loaded) return notFound();
  const p = loaded.program;
  const banner = heroBanners['cdl-training'] ?? null;
  return (
    <>
      <ProgramDetailPage program={p} banner={banner} />
      <section className="border-b border-emerald-200 bg-emerald-50 px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Workforce-funded training</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">FREE to those who qualify</h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-700">Eligible Indiana participants may receive WIOA/workforce funding for approved CDL training costs. Funding requires participant eligibility and authorization by the responsible workforce agency.</p>
          <p className="mt-3 text-sm font-semibold text-slate-600">If you do not qualify for funding, the published self-pay tuition is {p.selfPayCost || '$5,000'}. Ask admissions about available payment options.</p>
          <Link href="/check-eligibility" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800">Check Funding Eligibility</Link>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
              For transportation employers
            </p>
            <h2 className="mt-2 text-3xl font-black">Need emerging commercial-driving talent?</h2>
            <p className="mt-2 max-w-2xl leading-7 text-slate-200">
              Review candidate preparation, potential roles, regional pages, and the employer
              partnership process.
            </p>
          </div>
          <Link
            href="/employers/talent-network/cdl"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3 font-black text-slate-950"
          >
            CDL Employer Network
          </Link>
        </div>
      </section>
    </>
  );
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage('cdl-training');
  if (!loaded) return { title: 'CDL Training' };
  const p = loaded.program;
  return {
    title: p.metaTitle ?? p.title ?? 'CDL Training',
    description: p.metaDescription ?? p.subtitle ?? '',
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/cdl-training' },
  };
}
