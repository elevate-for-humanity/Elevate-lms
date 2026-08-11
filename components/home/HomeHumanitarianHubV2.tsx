import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  BriefcaseBusiness,
  GraduationCap,
  HeartHandshake,
  Landmark,
  MonitorCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

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

const audiences = [
  ['Learners', 'Training, LMS, testing, credentials, funding and career support.', '/apply'],
  ['Apprentices', 'RTI, OJL, competencies, hours, wage progression and completion.', '/apprenticeships'],
  ['Employers', 'Talent pipelines, host sites, hiring and work-based learning.', '/employer'],
  ['Workforce & Government', 'Eligibility, progress, compliance, reporting and outcomes.', '/partners'],
  ['Training Providers', 'Programs, cohorts, instructors, credentials and reporting.', '/for-providers'],
  ['Community Partners', 'Referrals, barrier reduction, resources and humanitarian support.', '/rise-forward-foundation'],
] as const;

export function HomeHumanitarianHubV2() {
  return (
    <div className="overflow-hidden bg-white text-slate-950">
      <section className="relative isolate min-h-[760px] bg-slate-950 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-brand-red-600/30 blur-[110px]" />
          <div className="absolute right-0 top-0 h-[520px] w-[520px] rounded-full bg-cyan-500/15 blur-[130px]" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-[110px]" />
        </div>

        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-24">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-amber-300" />
              AI-Powered 360° Humanitarian Workforce Hub
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-7xl xl:text-[78px]">
              More than training.
              <span className="block bg-gradient-to-r from-white via-white to-red-300 bg-clip-text text-transparent">
                A complete pathway forward.
              </span>
            </h1>
            <p className="mt-7 max-w-3xl text-lg font-medium leading-8 text-slate-200 sm:text-xl">
              Elevate connects hands-on training, an integrated LMS, testing, credentials, registered apprenticeship, workforce funding, employment, employers, supportive services and public-sector partners through one intelligent ecosystem.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/apply" className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-brand-red-600 px-7 py-4 text-base font-black text-white shadow-2xl shadow-brand-red-950/30 transition hover:-translate-y-0.5 hover:bg-brand-red-700">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/what-we-do" className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-4 text-base font-black text-white backdrop-blur-xl transition hover:bg-white/15">
                Explore the 360° Hub
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-2.5">
              {['DOL Apprenticeship Sponsor', 'ETPL Provider', 'National Testing & Proctoring', 'Integrated LMS'].map((item) => (
                <div key={item} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/50 px-3.5 py-2 text-xs font-extrabold text-slate-100 backdrop-blur-xl">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden min-h-[600px] lg:block">
            <div className="absolute left-0 top-2 h-[430px] w-[58%] overflow-hidden rounded-[34px] border border-white/15 shadow-2xl shadow-black/40">
              <Image src="/images/pages/training-classroom.webp" alt="Learners receiving career training" fill priority className="object-cover" sizes="34vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-red-200">Learn + LMS</p>
                <p className="mt-2 text-2xl font-black">Education that moves with the learner.</p>
              </div>
            </div>

            <div className="absolute right-0 top-20 h-[300px] w-[45%] overflow-hidden rounded-[30px] border border-white/15 shadow-2xl shadow-black/40">
              <Image src="/images/pages/healthcare-hero.webp" alt="Hands-on healthcare training" fill className="object-cover" sizes="28vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-sm font-black">Hands-on learning</div>
            </div>

            <div className="absolute bottom-6 right-6 h-[280px] w-[52%] overflow-hidden rounded-[30px] border border-white/15 shadow-2xl shadow-black/40">
              <Image src="/images/pages/apprenticeship-structure.webp" alt="Registered apprenticeship pathway" fill className="object-cover" sizes="30vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-red-950/85 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-sm font-black">Earn while you learn</div>
            </div>

            <div className="absolute bottom-24 left-[8%] z-20 w-[260px] rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-3 text-slate-950"><BrainCircuit className="h-6 w-6" /></div>
                <div><p className="text-xs font-black uppercase tracking-[0.14em] text-red-200">AI Layer</p><p className="text-sm font-black">One connected system</p></div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[82%] rounded-full bg-gradient-to-r from-brand-red-500 to-amber-300" /></div>
              <p className="mt-3 text-xs font-bold text-slate-300">LMS • CRM • Testing • Apprenticeship • Portals • Analytics</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-5 text-xs font-black uppercase tracking-[0.13em] text-slate-600 sm:px-8 lg:justify-between lg:px-10">
          <span>Training</span><span className="text-brand-red-600">•</span><span>LMS</span><span className="text-brand-red-600">•</span><span>Testing</span><span className="text-brand-red-600">•</span><span>Credentials</span><span className="text-brand-red-600">•</span><span>Apprenticeship</span><span className="text-brand-red-600">•</span><span>Funding</span><span className="text-brand-red-600">•</span><span>Employment</span><span className="text-brand-red-600">•</span><span>Support</span>
        </div>
      </section>

      <section className="bg-[#f6f3ee] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">The Elevate model</p>
              <h2 className="mt-3 text-4xl font-black leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-6xl">One hub. Multiple outcomes. No dead ends.</h2>
            </div>
            <p className="max-w-2xl text-lg font-semibold leading-8 text-slate-700 lg:justify-self-end">
              The experience should feel continuous: a person can enter through training, testing, funding, apprenticeship, employment or support and still move through the same connected ecosystem.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-12 lg:grid-rows-2">
            <Link href="/programs" className="group relative min-h-[520px] overflow-hidden rounded-[32px] lg:col-span-7 lg:row-span-2">
              <Image src="/images/hero/hero-skilled-trades.webp" alt="Hands-on skilled trades training" fill className="object-cover transition duration-700 group-hover:scale-[1.03]" sizes="60vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                <div className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white backdrop-blur-xl">Training + LMS</div>
                <h3 className="mt-4 max-w-xl text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">Learn online. Train hands-on. Track every milestone.</h3>
                <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-slate-200">Premium course delivery connects directly to real-world skills, instructors, assessments, credentials and progress.</p>
              </div>
            </Link>

            <Link href="/testing" className="group relative min-h-[250px] overflow-hidden rounded-[32px] lg:col-span-5">
              <Image src="/images/pages/programs-it-hero.webp" alt="Technology-enabled testing and credentialing" fill className="object-cover transition duration-700 group-hover:scale-[1.03]" sizes="42vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/45 to-transparent" />
              <div className="absolute inset-0 flex max-w-md flex-col justify-end p-7">
                <MonitorCheck className="h-8 w-8 text-cyan-300" />
                <h3 className="mt-4 text-3xl font-black text-white">Test. Verify. Credential.</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">Testing and proctoring are built into the pathway—not treated as an afterthought.</p>
              </div>
            </Link>

            <Link href="/career-services" className="group relative min-h-[250px] overflow-hidden rounded-[32px] bg-brand-red-700 lg:col-span-5">
              <Image src="/images/pages/business-meeting.webp" alt="Employers and workforce partners collaborating" fill className="object-cover opacity-45 transition duration-700 group-hover:scale-[1.03]" sizes="42vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-red-950/95 via-brand-red-800/70 to-brand-red-700/30" />
              <div className="absolute inset-0 flex max-w-md flex-col justify-end p-7">
                <BriefcaseBusiness className="h-8 w-8 text-amber-200" />
                <h3 className="mt-4 text-3xl font-black text-white">Move into work and advancement.</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-red-50">Career services, employers and workforce partners connect learning to economic mobility.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">360° pathway</p>
            <h2 className="mx-auto mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">The journey keeps moving.</h2>
          </div>
          <div className="relative mt-12">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent lg:block" />
            <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-8">
              {journey.map((step, index) => (
                <div key={step} className="group text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-slate-950 text-sm font-black text-white shadow-lg transition group-hover:-translate-y-1 group-hover:bg-brand-red-600">{index + 1}</div>
                  <p className="mt-4 text-sm font-black leading-5 text-slate-950">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-brand-red-600/20 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:px-10">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-red-300"><BrainCircuit className="h-5 w-5" /> AI operating layer</div>
            <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.045em] sm:text-5xl">The technology should feel as advanced as the mission.</h2>
            <p className="mt-6 text-lg font-semibold leading-8 text-slate-300">The LMS is a major pillar, connected to intake, CRM, case management, testing, apprenticeship tracking, employer workflows, portals, analytics and administration.</p>
            <Link href="/platform" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5">Explore the AI platform <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Elevate Command Layer</p><p className="mt-1 text-lg font-black">Connected workforce operations</p></div>
              <div className="flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-red-400" /></div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ['LMS', 'Learning, progress, assessments'],
                ['CRM', 'Intake, leads, communications'],
                ['Testing', 'Proctoring, credentials, results'],
                ['Apprenticeship', 'RTI, OJL, competencies'],
                ['Workforce', 'Eligibility, funding, outcomes'],
                ['Portals', 'Role-based partner access'],
                ['Admin', 'Operations, compliance, finance'],
                ['AI', 'Automation, orchestration, insights'],
              ].map(([title, body], index) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <div className="flex items-center justify-between"><p className="font-black">{title}</p><span className={`h-2.5 w-2.5 rounded-full ${index % 3 === 0 ? 'bg-cyan-300' : index % 3 === 1 ? 'bg-emerald-300' : 'bg-red-300'}`} /></div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div><p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">Built for the whole ecosystem</p><h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">One platform. Different doors in.</h2></div>
            <p className="text-lg font-semibold leading-8 text-slate-700">People should see the pathway that belongs to them—not a wall of portal links.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {audiences.map(([title, body, href], index) => {
              const Icon = [GraduationCap, BadgeCheck, BriefcaseBusiness, Landmark, MonitorCheck, HeartHandshake][index];
              return (
                <Link key={title} href={href} className="group rounded-[26px] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-brand-red-600"><Icon className="h-6 w-6" /></div>
                  <h3 className="mt-6 text-2xl font-black tracking-tight">{title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-650">{body}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand-red-700">Enter pathway <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-brand-red-700 py-20 text-white sm:py-24">
        <Image src="/images/pages/about-supportive-services.webp" alt="Humanitarian and supportive services" fill className="-z-20 object-cover opacity-35" sizes="100vw" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-red-950 via-brand-red-800/95 to-slate-950/75" />
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:px-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-red-100">Humanitarian by design</p>
            <h2 className="mt-3 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl">Because workforce success requires more than a course.</h2>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-red-50">Education, opportunity, employment and support should work together. The humanitarian layer exists to help people keep moving when barriers would otherwise stop the journey.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {['Barrier reduction', 'Community resources', 'Career navigation', 'Employment support', 'Partner referrals', 'Long-term advancement'].map((item) => <div key={item} className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm font-black backdrop-blur-xl">{item}</div>)}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f3ee] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['DOL Registered Apprenticeship', 'Sponsor infrastructure, RTI, OJL, employer sites and compliance.'],
              ['ETPL Workforce Training', 'Eligible training pathways connected to state workforce systems.'],
              ['Testing & Proctoring', 'Credential preparation, exam delivery pathways and verified outcomes.'],
              ['Government & Partner Reporting', 'Role-based access, documentation, outcomes and operational visibility.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <ShieldCheck className="h-7 w-7 text-brand-red-700" />
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-650">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div><p className="text-sm font-black uppercase tracking-[0.16em] text-red-300">Your next step starts here</p><h2 className="mt-2 text-4xl font-black tracking-[-0.04em]">Enter the hub through the pathway that fits you.</h2></div>
          <div className="flex flex-col gap-3 sm:flex-row"><Link href="/apply" className="rounded-2xl bg-brand-red-600 px-6 py-4 text-center text-sm font-black hover:bg-brand-red-700">Get Started</Link><Link href="/partners" className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-center text-sm font-black hover:bg-white/15">Partner with Elevate</Link></div>
        </div>
      </section>
    </div>
  );
}
