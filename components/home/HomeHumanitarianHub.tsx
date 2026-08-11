import Image from 'next/image';
import Link from 'next/link';

const pillars = [
  {
    title: 'Training & LMS',
    body: 'Career training, digital coursework, assessments, progress tracking, instructor support, and AI-assisted learning in one connected environment.',
    href: '/programs',
    label: 'Learn & train',
  },
  {
    title: 'Testing & Credentials',
    body: 'Authorized testing and proctoring pathways that help learners move from preparation to verified industry credentials.',
    href: '/testing',
    label: 'Test & credential',
  },
  {
    title: 'Hands-On Learning',
    body: 'Practical experience, work-based learning, labs, and employer-connected training designed around real workforce outcomes.',
    href: '/what-we-do',
    label: 'Build experience',
  },
  {
    title: 'Registered Apprenticeship',
    body: 'DOL-registered apprenticeship infrastructure connecting related instruction, supervised on-the-job learning, employers, and compliance.',
    href: '/apprenticeships',
    label: 'Earn while learning',
  },
  {
    title: 'Funding & Eligibility',
    body: 'Workforce funding navigation, eligibility workflows, and partner coordination that help qualified participants access training opportunities.',
    href: '/funding',
    label: 'Find funding',
  },
  {
    title: 'Employment & Advancement',
    body: 'Career navigation, employer connections, job-readiness support, placement pathways, and continued advancement after training.',
    href: '/career-services',
    label: 'Move into work',
  },
  {
    title: 'Humanitarian Support',
    body: 'Barrier-reduction, community resources, supportive-service navigation, and coordinated pathways designed around the whole person.',
    href: '/rise-forward-foundation',
    label: 'Get support',
  },
  {
    title: 'AI & Workforce Technology',
    body: 'AI-enabled operations connecting learners, employers, providers, workforce partners, administrators, and data across the full lifecycle.',
    href: '/platform',
    label: 'Explore the platform',
  },
];

const audiences = [
  { title: 'Individuals & Learners', body: 'Training, funding, LMS access, testing, credentials, career support, and advancement.', href: '/apply' },
  { title: 'Apprentices', body: 'RTI, on-the-job learning, competencies, hours, documentation, wage progression, and completion.', href: '/apprenticeships' },
  { title: 'Employers & Host Sites', body: 'Talent pipelines, work-based learning, apprentice oversight, hiring, and workforce development.', href: '/employer' },
  { title: 'Workforce & Government', body: 'Eligibility, participant progress, compliance, reporting, outcomes, and partner visibility.', href: '/partners' },
  { title: 'Training Providers', body: 'Programs, cohorts, credentials, instructors, referrals, documentation, and reporting.', href: '/for-providers' },
  { title: 'Community Partners', body: 'Coordinated support, referrals, barrier reduction, resources, and humanitarian impact.', href: '/rise-forward-foundation' },
];

const journey = [
  'Discover',
  'Get Funded',
  'Learn',
  'Train Hands-On',
  'Test',
  'Earn Credentials',
  'Work',
  'Advance',
];

const platformLayers = [
  'AI orchestration',
  'Learning Management System',
  'CRM & intake',
  'Testing & credentialing',
  'Apprenticeship tracking',
  'Case management',
  'Employer & partner portals',
  'Admin, analytics & reporting',
];

const pathways = [
  {
    title: 'Healthcare',
    body: 'Patient-care, allied-health, and credential pathways built around employability.',
    href: '/programs/healthcare',
    image: '/images/pages/healthcare-hero.webp',
  },
  {
    title: 'Skilled Trades',
    body: 'Hands-on technical pathways connected to real workplace skills and industry demand.',
    href: '/programs/skilled-trades',
    image: '/images/hero/hero-skilled-trades.webp',
  },
  {
    title: 'Apprenticeships',
    body: 'Structured earn-while-you-learn pathways with related instruction and supervised OJL.',
    href: '/apprenticeships',
    image: '/images/pages/apprenticeship-structure.webp',
  },
  {
    title: 'Technology & Business',
    body: 'Digital, business, administrative, and entrepreneurial pathways supported by AI tools.',
    href: '/programs/technology',
    image: '/images/pages/programs-it-hero.webp',
  },
];

export function HomeHumanitarianHub() {
  return (
    <div className="bg-white text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <Image
            src="/images/heroes/hero-homepage.webp"
            alt="Learners and workforce professionals building career pathways through Elevate for Humanity"
            fill
            priority
            className="object-cover opacity-30"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.90)_45%,rgba(2,6,23,0.52)_100%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-28">
          <div className="max-w-4xl">
            <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white">
              AI-Powered 360° Humanitarian Workforce Hub
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              One connected ecosystem to learn, train, test, work, build, and advance.
            </h1>
            <p className="mt-7 max-w-3xl text-lg font-medium leading-8 text-slate-200 sm:text-xl sm:leading-9">
              Elevate for Humanity connects training, an integrated LMS, hands-on learning, testing, credentials, registered apprenticeship, workforce funding, employment, employers, supportive services, and public-sector partners through one AI-enabled platform.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/apply"
                className="inline-flex min-h-[56px] items-center justify-center rounded-xl bg-brand-red-600 px-7 py-4 text-base font-extrabold text-white shadow-lg shadow-black/20 transition hover:bg-brand-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              >
                Get Started
              </Link>
              <Link
                href="/what-we-do"
                className="inline-flex min-h-[56px] items-center justify-center rounded-xl border border-white/35 bg-white/10 px-7 py-4 text-base font-extrabold text-white backdrop-blur-sm transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              >
                Explore the 360° Hub
              </Link>
            </div>

            <div className="mt-10 grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-4">
              {['DOL Apprenticeship Sponsor', 'ETPL Training Provider', 'Testing & Proctoring', 'Integrated LMS'].map((item) => (
                <div key={item} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-sm font-bold leading-5 text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="hidden rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl lg:block">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-300">The Elevate difference</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">360° means the journey does not stop at enrollment.</h2>
            <div className="mt-7 space-y-4">
              {['Find the right pathway', 'Navigate eligible funding', 'Learn online and hands-on', 'Test and earn credentials', 'Connect to work and advancement', 'Receive continued support'].map((item, index) => (
                <div key={item} className="flex items-start gap-4 rounded-2xl bg-slate-950/40 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-slate-950">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="pt-1.5 text-sm font-bold leading-5 text-white">{item}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-4 lg:text-left">
            {[
              ['Humanitarian', 'Whole-person pathways and barrier-reduction support'],
              ['Educational', 'Training, LMS, hands-on learning, testing, and credentials'],
              ['Workforce', 'Employers, apprenticeships, funding, employment, and advancement'],
              ['AI-Powered', 'Connected workflows, data, automation, portals, and analytics'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.12em] text-brand-red-700">{title}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">The 360° ecosystem</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">Everything needed to move from opportunity to stability.</h2>
            <p className="mt-5 text-lg font-medium leading-8 text-slate-700">
              Instead of sending people through disconnected systems, Elevate connects the major parts of the workforce and education journey inside one coordinated hub.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pillars.map((pillar, index) => (
              <Link
                key={pillar.title}
                href={pillar.href}
                className="group flex min-h-[290px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-red-100"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-400">0{index + 1}</span>
                  <span className="text-sm font-black text-brand-red-700 transition group-hover:translate-x-1">→</span>
                </div>
                <h3 className="mt-8 text-2xl font-black tracking-tight text-slate-950">{pillar.title}</h3>
                <p className="mt-4 flex-1 text-sm font-medium leading-6 text-slate-650">{pillar.body}</p>
                <p className="mt-6 text-sm font-extrabold text-slate-950">{pillar.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">One continuous journey</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">From first contact to long-term advancement.</h2>
            </div>
            <p className="max-w-xl text-base font-medium leading-7 text-slate-700">
              Every stage should hand off cleanly to the next so learners, staff, employers, and partners can see progress instead of navigating disconnected programs.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            {journey.map((step, index) => (
              <div key={step} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Step {index + 1}</p>
                <p className="mt-3 text-base font-black leading-5 text-slate-950">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-slate-950 py-20 text-white sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-red-300">AI is the operating layer</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.03em] sm:text-5xl">A humanitarian mission powered by modern infrastructure.</h2>
            <p className="mt-6 text-lg font-medium leading-8 text-slate-300">
              The LMS is a major pillar, but it is connected to intake, case management, testing, apprenticeships, employer workflows, analytics, and administrative operations rather than operating as a stand-alone course portal.
            </p>
            <Link href="/platform" className="mt-8 inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-slate-100">
              Explore the AI platform
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {platformLayers.map((layer) => (
              <div key={layer} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <p className="text-base font-extrabold text-white">{layer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">Built for the whole ecosystem</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">One platform. Different views for every role.</h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {audiences.map((audience) => (
              <Link key={audience.title} href={audience.href} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-slate-300 hover:shadow-lg">
                <h3 className="text-xl font-black text-slate-950">{audience.title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-700">{audience.body}</p>
                <p className="mt-6 text-sm font-extrabold text-brand-red-700">Enter this pathway →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">Education that connects to work</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">Premium learning pathways with real-world progression.</h2>
            </div>
            <Link href="/programs" className="text-sm font-extrabold text-slate-950 hover:text-brand-red-700">View all programs →</Link>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pathways.map((pathway) => (
              <Link key={pathway.title} href={pathway.href} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                  <Image src={pathway.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 25vw" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black text-slate-950">{pathway.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-700">{pathway.body}</p>
                  <p className="mt-5 text-sm font-extrabold text-brand-red-700">Explore pathway →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10">
          <div className="relative min-h-[440px] overflow-hidden rounded-[2rem] bg-slate-200">
            <Image
              src="/images/pages/about-supportive-services.webp"
              alt="Community and supportive services connected to workforce advancement"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">Humanitarian by design</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">Workforce success requires more than a course.</h2>
            <p className="mt-6 text-lg font-medium leading-8 text-slate-700">
              Elevate is designed around the whole journey—education, opportunity, employment, and the support people may need to keep moving forward. That humanitarian layer is what connects the training system to lasting outcomes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/rise-forward-foundation" className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-extrabold text-white hover:bg-slate-800">Explore supportive services</Link>
              <Link href="/impact" className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-extrabold text-slate-950 hover:bg-slate-50">View impact</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-center text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Institutional trust layer</p>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['DOL Registered Apprenticeship', 'Sponsor infrastructure, OJL, RTI, employer sites, and compliance.'],
              ['ETPL Workforce Training', 'Eligible training pathways connected to state workforce systems.'],
              ['Testing & Proctoring', 'Credential preparation, testing workflows, and authorized exam delivery pathways.'],
              ['Government & Partner Reporting', 'Role-based portals, documentation, outcomes, and operational visibility.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-base font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-red-700 py-20 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-red-100">Your next step starts here</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.03em] sm:text-5xl">Enter the hub through the pathway that fits you.</h2>
            <p className="mt-4 text-lg font-medium leading-8 text-red-50">Individuals, employers, workforce agencies, providers, and community partners all connect through one Elevate ecosystem.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
            <Link href="/apply" className="inline-flex min-h-[54px] items-center justify-center rounded-xl bg-white px-7 py-3.5 text-sm font-extrabold text-slate-950 hover:bg-slate-100">Get Started</Link>
            <Link href="/partners" className="inline-flex min-h-[54px] items-center justify-center rounded-xl border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-extrabold text-white hover:bg-white/15">Partner with Elevate</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
