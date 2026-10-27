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
      <ProgramDetailPage
        program={p}
        banner={banner}
        heroOverride={
          <section className="relative overflow-hidden bg-sky-100">
            <img
              src="/images/cdl-partner/road.jpg"
              alt="Commercial tractor-trailer on the open road"
              className="h-64 w-full object-cover sm:h-96 lg:h-[520px]"
            />
            <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
              <p className="font-bold uppercase tracking-widest text-blue-800">
                Elevate for Humanity · Transportation
              </p>
              <h1 className="mt-3 text-4xl font-black text-slate-950 sm:text-6xl">
                Your next chapter starts behind the wheel.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                Class A training, hands-on driving practice, flexible scheduling, and support for
                your next career step.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/apply?program=cdl-training"
                  className="rounded-xl bg-blue-700 px-6 py-4 font-bold text-white hover:bg-blue-800"
                >
                  Start your CDL application
                </Link>
                <Link
                  href="/funding/workone-intake"
                  className="rounded-xl bg-amber-300 px-6 py-4 font-bold text-slate-950 hover:bg-amber-400"
                >
                  Schedule WorkOne intake
                </Link>
              </div>
            </div>
          </section>
        }
        visualContent={
          <section className="bg-white px-5 py-10">
            <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:items-center">
              <img
                src="/images/cdl-partner/training.jpg"
                alt="Commercial trucks representing the CDL training pathway"
                className="aspect-[3/2] w-full rounded-3xl object-cover"
                loading="lazy"
              />
              <div>
                <h2 className="text-3xl font-black text-slate-950">
                  Train in Indianapolis. Plan your next move with Elevate.
                </h2>
                <p className="mt-4 leading-7 text-slate-700">
                  Hands-on Class A training takes place at our partner location: 5284 E 23rd St,
                  Indianapolis, IN 46218. Full-time and part-time options are available; admissions
                  confirms your start date, hours, and appointment before arrival.
                </p>
                <p className="mt-4 leading-7 text-slate-700">
                  Online Hazmat training is a separate offering. Ask Elevate admissions about
                  availability, prerequisites, and pricing. Job-placement assistance supports your
                  search; employment is not guaranteed.
                </p>
                <Link
                  href="/contact?program=cdl-training"
                  className="mt-5 inline-flex rounded-xl bg-amber-300 px-5 py-3 font-bold text-slate-950"
                >
                  Contact Elevate admissions
                </Link>
              </div>
            </div>
          </section>
        }
      />
      <section className="border-b border-emerald-200 bg-emerald-50 px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
            Workforce-funded training
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">FREE to those who qualify</h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-700">
            Eligible Indiana participants may receive WIOA/workforce funding for approved CDL
            training costs. Funding requires participant eligibility and authorization by the
            responsible workforce agency.
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-600">
            If you do not qualify for funding, the published self-pay tuition is{' '}
            {p.selfPayCost || '$5,000'}. Ask admissions about available payment options.
          </p>
          <Link
            href="/check-eligibility"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800"
          >
            Check Funding Eligibility
          </Link>
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
