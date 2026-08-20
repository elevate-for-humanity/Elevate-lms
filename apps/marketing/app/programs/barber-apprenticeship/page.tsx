import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BadgeCheck, BookOpen, Building2, Scissors, ShieldCheck } from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import HeroPicture from '@/components/marketing/HeroPicture';
import BeautyTheoryDailyPolicy from '@/components/programs/beauty/BeautyTheoryDailyPolicy';
import FeaturedHostPartners from '@/components/programs/beauty/FeaturedHostPartners';
import BarberWorkforceNetworkMap from '@/components/programs/beauty/BarberWorkforceNetworkMap';
import BeautyApprenticeshipAuthority, { buildBeautyProgramStructuredData } from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import heroBanners from '@/content/heroBanners';
import { loadProgramForPage } from '@/lib/programs/load-program-page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function BarberApprenticeshipPage() {
  const loaded = await loadProgramForPage('barber-apprenticeship');
  if (!loaded) return notFound();

  const program = loaded.program;
  const banner = heroBanners['barber-apprenticeship'] ?? null;
  const structuredData = buildBeautyProgramStructuredData(program);

  const hero = banner?.videoSrcDesktop ? (
    <HeroVideo
      videoSrcDesktop={banner.videoSrcDesktop}
      videoSrcMobile={banner.videoSrcMobile ?? banner.videoSrcDesktop}
      posterImage={banner.posterImage || program.heroImage}
      voiceoverSrc={banner.voiceoverSrc}
      microLabel={banner.microLabel}
      analyticsName={banner.analyticsName}
      belowHeroHeadline="Registered Barber Apprenticeship"
      belowHeroSubheadline="Competency-based registered apprenticeship with verified Related Technical Instruction, supervised host-shop training, digital progress records, and Indiana licensing preparation."
      ctas={[
        { label: 'Apply for Barber Apprenticeship', href: program.cta.applyHref },
        { label: 'Become a Host Shop', href: '/partners/host-shops' },
      ]}
      trustIndicators={['DOL Registered Apprenticeship', 'Host-Shop Training', 'Digital OJL / RTI Records']}
      transcript={banner.transcript}
    />
  ) : (
    <HeroPicture
      src={program.heroImage}
      alt={program.heroImageAlt || 'Barber apprenticeship training'}
      belowHeroHeadline="Registered Barber Apprenticeship"
      belowHeroSubheadline="Competency-based registered apprenticeship with verified Related Technical Instruction, supervised host-shop training, digital progress records, and Indiana licensing preparation."
      ctas={[
        { label: 'Apply for Barber Apprenticeship', href: program.cta.applyHref },
        { label: 'Become a Host Shop', href: '/partners/host-shops' },
      ]}
      trustIndicators={['DOL Registered Apprenticeship', 'Host-Shop Training', 'Digital OJL / RTI Records']}
    />
  );

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />

      {hero}

      <section className="border-b border-slate-200 bg-white px-4 py-10">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4">
          <Fact icon={ShieldCheck} label="Registered model" value="Competency based" />
          <Fact icon={BookOpen} label="Required RTI" value="144 verified hours" />
          <Fact icon={Scissors} label="Training setting" value="Approved host shop" />
          <Fact icon={BadgeCheck} label="Self-pay tuition" value={program.selfPayCost || 'See enrollment disclosure'} />
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.15em] text-brand-red-700">How the program works</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">One barber pathway. One set of requirements.</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">{program.subtitle}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {program.outcomes.slice(0, 6).map((outcome) => (
                  <div key={outcome.statement} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h2 className="font-black text-slate-950">{outcome.statement}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Checked: {outcome.assessedAt}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white">
              <h2 className="text-2xl font-black">Start the right path</h2>
              <p className="mt-3 leading-7 text-slate-300">Apply as an apprentice, or register a licensed shop as a host site. Funding is reviewed separately and is never assumed from provider status.</p>
              <div className="mt-6 space-y-3">
                <Link href={program.cta.applyHref} className="flex items-center justify-between rounded-xl bg-brand-red-600 px-5 py-4 font-black hover:bg-brand-red-700">Apply as an Apprentice <ArrowRight className="h-5 w-5" /></Link>
                <Link href="/partners/host-shops" className="flex items-center justify-between rounded-xl bg-white px-5 py-4 font-black text-slate-950 hover:bg-slate-100">Become a Host Shop <Building2 className="h-5 w-5" /></Link>
                <Link href="/contact" className="block rounded-xl border border-slate-600 px-5 py-4 text-center font-bold hover:border-slate-400">Talk to Admissions</Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.15em] text-brand-red-700">Curriculum</p>
          <h2 className="mt-3 text-3xl font-black">What you learn</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {program.curriculum.map((module, index) => (
              <article key={module.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Module {index + 1}</div>
                <h3 className="mt-2 text-xl font-black">{module.title}</h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                  {module.topics.map((topic) => <li key={topic}>• {topic}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <BeautyTheoryDailyPolicy programTitle="Barber Apprenticeship" />
      <BeautyApprenticeshipAuthority program={program} />

      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.15em] text-brand-red-700">Host-shop network</p>
            <h2 className="mt-3 text-3xl font-black">Train where the work happens.</h2>
            <p className="mt-3 leading-7 text-slate-700">Approved host shops are part of the supervised apprenticeship workflow. Availability is verified during placement rather than implied for locations without an active host record.</p>
          </div>
          <FeaturedHostPartners />
          <div className="mt-10"><BarberWorkforceNetworkMap /></div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-14 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black sm:text-4xl">Ready to enter the barber apprenticeship?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">Review the exact program, host-shop, payment, and funding path before enrollment. Public funding requires current participant authorization.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={program.cta.applyHref} className="rounded-xl bg-brand-red-600 px-8 py-4 font-black text-white hover:bg-brand-red-700">Apply Now</Link>
            <Link href="/partners/host-shops" className="rounded-xl bg-white px-8 py-4 font-black text-slate-950 hover:bg-slate-100">Host a Barber Apprentice</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-6 w-6 text-brand-red-700" />
      <div className="mt-3 text-xs font-black uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-black text-slate-950">{value}</div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Registered Barber Apprenticeship Program | Indiana | Elevate for Humanity',
    description:
      'Indiana competency-based registered barber apprenticeship with 144 verified hours of Related Technical Instruction, supervised host-shop training, digital progress records, and Indiana licensing preparation.',
    keywords: [
      'barber apprenticeship Indiana',
      'registered barber apprenticeship',
      'Indiana barber apprenticeship program',
      'barber apprentice program Indianapolis',
      'earn while you learn barber',
      'host barbershop apprenticeship',
      'Indiana barber license apprenticeship',
    ],
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship' },
    openGraph: {
      title: 'Registered Barber Apprenticeship Program | Indiana',
      description: 'Competency-based registered barber apprenticeship with verified RTI, supervised host-shop training, digital progress records, and Indiana licensing preparation.',
      url: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship',
      type: 'website',
    },
  };
}
