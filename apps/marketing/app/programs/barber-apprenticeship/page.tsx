import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BadgeCheck, BookOpen, Building2, Clock3, Scissors, ShieldCheck } from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import BeautyTheoryDailyPolicy from '@/components/programs/beauty/BeautyTheoryDailyPolicy';
import FeaturedHostPartners from '@/components/programs/beauty/FeaturedHostPartners';
import BarberWorkforceNetworkMap from '@/components/programs/beauty/BarberWorkforceNetworkMap';
import BarberPaymentPlanner from '@/components/programs/beauty/BarberPaymentPlanner';
import BeautyApprenticeshipAuthority, { buildBeautyProgramStructuredData } from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import { loadProgramForPage } from '@/lib/programs/load-program-page';
import heroBanners from '@/content/heroBanners';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const BARBER_HERO_IMAGE =
  'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/barber-hero-new.webp';

const FLOW = [
  { icon: BookOpen, title: 'Learn the theory', body: 'Complete verified Related Technical Instruction alongside your hands-on training.' },
  { icon: Scissors, title: 'Train in a host shop', body: 'Build real barbering skills under approved supervision in the workplace.' },
  { icon: Clock3, title: 'Track progress', body: 'Document OJL, RTI, skills, attendance, and required apprenticeship milestones.' },
  { icon: BadgeCheck, title: 'Prepare for licensing', body: 'Complete the pathway requirements tied to Indiana barber licensing preparation.' },
] as const;

const VISUAL_STORY = [
  {
    image: '/images/pages/barber-hands-on-bright.webp',
    alt: 'Licensed barber teaching an apprentice in a bright working barbershop',
    label: 'Related Technical Instruction',
    title: 'Learn the why behind the work.',
    body: 'Theory, sanitation, client safety, professional practice, and technical knowledge support what happens in the shop.',
  },
  {
    image: '/images/pages/barber-fade.webp',
    alt: 'Close view of clipper technique used for a clean, professional fade',
    label: 'Hands-on Barbering',
    title: 'Build skill through supervised practice.',
    body: 'Apprentices develop barbering skills through real practice, documented competencies, and structured supervision.',
  },
  {
    image: '/images/partners/kountry-kutz-official.webp',
    alt: 'Licensed host barbershop supporting apprenticeship training',
    label: 'Host Shop Experience',
    title: 'Train in the environment where the job happens.',
    body: 'Approved host shops provide the workplace setting for supervised on-the-job learning and progress verification.',
  },
] as const;

export default async function BarberApprenticeshipPage() {
  const loaded = await loadProgramForPage('barber-apprenticeship');
  if (!loaded) return notFound();

  const program = loaded.program;
  const heroBanner = heroBanners['barber-apprenticeship'];
  const structuredData = buildBeautyProgramStructuredData({
    ...program,
    heroImage: BARBER_HERO_IMAGE,
  });

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />

      <HeroVideo
        videoSrcDesktop={heroBanner?.videoSrcDesktop}
        videoSrcMobile={heroBanner?.videoSrcMobile ?? heroBanner?.videoSrcDesktop}
        posterImage={BARBER_HERO_IMAGE}
        voiceoverSrc={heroBanner?.voiceoverSrc}
        analyticsName="barber-apprenticeship"
        heightClassName="h-[clamp(360px,55vh,600px)]"
        overlayMode="none"
        transcript={heroBanner?.transcript ?? 'Barber apprenticeship training in a professional shop environment.'}
      />

      <section className="border-b border-slate-200 bg-white px-4 py-9 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700 sm:text-sm">Registered Barber Apprenticeship</p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Learn the trade where the work happens.
            </h1>
            <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-700 sm:text-lg sm:leading-8">
              A competency-based barber apprenticeship combining verified technical instruction, supervised host-shop training, digital progress records, and Indiana licensing preparation.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={program.cta.applyHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-7 py-3.5 text-sm font-black text-white hover:bg-brand-red-700">
                Apply for Barber Apprenticeship <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/partners/host-shops" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-brand-blue-700 bg-white px-7 py-3.5 text-sm font-black text-brand-blue-900 hover:bg-sky-50">
                Become a Host Shop <Building2 className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-4 py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 lg:grid-cols-4">
          <Fact icon={ShieldCheck} label="Registered model" value="Competency based" />
          <Fact icon={BookOpen} label="Required RTI" value="144 verified hours" />
          <Fact icon={Scissors} label="Training setting" value="Approved host shop" />
          <Fact icon={BadgeCheck} label="Self-pay tuition" value={program.selfPayCost || 'See program details'} />
        </div>
      </section>

      <section className="px-4 py-14 sm:py-18">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100 sm:aspect-[16/10] lg:aspect-auto lg:min-h-[420px]">
              <Image
                src="/images/pages/barber-hero-main.webp"
                alt="Barber apprentice practicing supervised haircutting and grooming skills"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 48vw"
              />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700 sm:text-sm">How it works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">One pathway from training to documented progress.</h2>
              <p className="mt-4 text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">{program.subtitle}</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {FLOW.map(({ icon: Icon, title, body }) => (
                  <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <Icon className="h-6 w-6 text-brand-red-700" aria-hidden="true" />
                    <h3 className="mt-3 text-lg font-black text-slate-950">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:py-18" aria-labelledby="barber-visual-story-heading">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700 sm:text-sm">See the apprenticeship</p>
            <h2 id="barber-visual-story-heading" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Theory, practice, and workplace learning belong together.</h2>
            <p className="mt-4 text-base leading-7 text-slate-700 sm:text-lg">More views of classroom instruction, hands-on barbering, and the host-shop experience.</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {VISUAL_STORY.map((item) => (
              <article key={item.title} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    loading="lazy"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-red-700">{item.label}</p>
                  <h3 className="mt-2 text-xl font-black leading-tight text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-orange-200 bg-gradient-to-br from-orange-50 via-white to-sky-50 px-4 py-14 sm:py-18" aria-labelledby="barber-payment-heading">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700 sm:text-sm">Plan your payment</p>
            <h2 id="barber-payment-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">See the price, calculate a plan, and choose how to pay.</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">Review the self-pay tuition, adjust the available payment-plan estimate, or continue to the BNPL options supported through the secure Stripe checkout flow. Approval and installment terms are determined by the selected provider.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/programs/barber-apprenticeship/payment-setup" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-7 py-3.5 font-black text-white hover:bg-brand-red-700">Open Payment Calculator</Link>
              <Link href="/programs/barber-apprenticeship/payment/bnpl" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-blue-700 bg-white px-7 py-3.5 font-black text-brand-blue-900 hover:bg-sky-50">View BNPL Options</Link>
              <Link href={program.cta.applyHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-400 bg-white px-7 py-3.5 font-black text-slate-950 hover:bg-slate-50">Apply Before Checkout</Link>
            </div>
          </div>
          <BarberPaymentPlanner />
        </div>
      </section>

      <section className="border-y border-sky-200 bg-gradient-to-br from-sky-50 via-white to-orange-50 px-4 py-14 text-slate-950">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700 sm:text-sm">Skills you build</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Training that connects theory to the shop floor.</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {program.curriculum.map((module, index) => (
              <article key={module.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-brand-red-700">Module {index + 1}</p>
                <h3 className="mt-2 text-xl font-black text-slate-950">{module.title}</h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                  {module.topics.slice(0, 4).map((topic) => <li key={topic}>• {topic}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <BeautyTheoryDailyPolicy programTitle="Barber Apprenticeship" />
      <BeautyApprenticeshipAuthority program={program} />

      <section className="px-4 py-14 sm:py-18">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700 sm:text-sm">Host-shop network</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Train where the work happens.</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">Approved host shops provide the supervised work setting. Placement availability is verified during enrollment and is not implied by a public listing.</p>
          </div>
          <FeaturedHostPartners programSlug="barber-apprenticeship" />
          <div className="mt-10"><BarberWorkforceNetworkMap /></div>
        </div>
      </section>

      <section className="border-t border-sky-200 bg-gradient-to-r from-brand-blue-50 via-white to-orange-50 px-4 py-14 text-slate-950">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black sm:text-4xl">Ready to start the barber apprenticeship?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">Apply as an apprentice or start the host-shop process. Funding and placement are verified separately before enrollment is finalized.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={program.cta.applyHref} className="rounded-xl bg-brand-red-600 px-8 py-4 font-black text-white hover:bg-brand-red-700">Apply Now</Link>
            <Link href="/partners/host-shops" className="rounded-xl border-2 border-brand-blue-700 bg-white px-8 py-4 font-black text-brand-blue-900 hover:bg-sky-50">Host a Barber Apprentice</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <Icon className="h-5 w-5 text-brand-red-700 sm:h-6 sm:w-6" />
      <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:text-xs">{label}</div>
      <div className="mt-1 text-sm font-black leading-5 text-slate-950 sm:text-lg">{value}</div>
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
      images: [
        {
          url: BARBER_HERO_IMAGE,
          alt: 'Barber apprentice completing supervised hands-on training in Indiana',
        },
      ],
    },
  };
}
