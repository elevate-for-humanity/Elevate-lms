import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, GraduationCap, Handshake, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { organization } from '@/lib/config/organization';

export const metadata: Metadata = {
  title: 'About Elevate for Humanity | Indianapolis Workforce Development',
  description:
    'Meet Elevate for Humanity, its founder, and the workforce training, apprenticeship, testing, funding-navigation, and employer services it provides in Indianapolis.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/about' },
};

const capabilities = [
  {
    title: 'Career & Technical Training',
    description: 'Explore healthcare, skilled trades, transportation, technology, business, and other career pathways.',
    icon: GraduationCap,
    href: '/programs',
    image: '/images/pages/cna-nursing-real.webp',
  },
  {
    title: 'Registered Apprenticeship',
    description: `Structured work-based learning coordinated through RAPIDS Sponsor ID ${organization.approvals.registeredApprenticeship.rapidsId}.`,
    icon: ShieldCheck,
    href: '/apprenticeships',
    image: '/images/pages/apprenticeships-page-1.webp',
  },
  {
    title: 'Funding Navigation',
    description: 'Understand potential WIOA, Workforce Ready Grant, and other workforce funding pathways before enrollment.',
    icon: CheckCircle2,
    href: '/funding',
    image: '/images/pages/funding-impact-1.webp',
  },
  {
    title: 'Employer Partnerships',
    description: 'Connect training, apprenticeship host sites, work-based learning, and employer talent needs.',
    icon: Handshake,
    href: '/employers',
    image: '/images/pages/about-employer-partners.webp',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'About Us' }]} />
        </div>
      </div>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-orange-300">Indianapolis, Indiana</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Workforce pathways built to move people forward.
            </h1>
            <p className="mt-6 max-w-3xl text-xl font-medium leading-8 text-white sm:text-2xl sm:leading-9">
              Elevate for Humanity connects career training, registered apprenticeship, testing, funding navigation, and employer partnerships in one workforce system.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/programs" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-7 py-4 text-lg font-extrabold text-white hover:bg-brand-red-700">
                Explore Programs <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border-2 border-white/60 px-7 py-4 text-lg font-extrabold text-white hover:bg-white/10">
                Talk With Elevate
              </Link>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-3xl shadow-2xl sm:min-h-[460px]">
            <Image
              src="/images/team/elizabeth-greene.webp"
              alt="Elizabeth Greene, Founder and CEO of Elevate for Humanity"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover object-top"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">Founder & Leadership</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Elizabeth Greene</h2>
            <p className="mt-2 text-xl font-bold text-slate-800">Founder &amp; Chief Executive Officer</p>
          </div>
          <div className="space-y-5 text-lg leading-8 text-slate-800">
            <p>
              Elizabeth Greene founded Elevate for Humanity to create a clearer path between career training and the systems people must navigate to actually use that training: workforce funding, apprenticeship, testing, employer participation, and participant support.
            </p>
            <p>
              Her leadership focus is operational—building the training pathways, partnerships, digital tools, compliance processes, and employer connections that allow applicants to move from interest to enrollment and into a career or work-based learning pathway.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/apprenticeships" className="rounded-xl bg-slate-950 px-5 py-3 text-base font-bold text-white hover:bg-slate-800">Registered Apprenticeships</Link>
              <Link href="/compliance/center" className="rounded-xl border-2 border-slate-300 px-5 py-3 text-base font-bold text-slate-900 hover:bg-slate-50">Approvals & Compliance</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">What Elevate Does</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">One organization. Multiple entry points.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Applicants, employers, apprentices, testing candidates, and workforce partners should be able to immediately see where they fit.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {capabilities.map(({ title, description, icon: Icon, href, image }) => (
              <article key={title} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <Link href={href} className="block">
                  <div className="relative h-56 overflow-hidden sm:h-64">
                    <Image src={image} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 50vw" />
                  </div>
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-brand-red-50 p-2.5"><Icon className="h-6 w-6 text-brand-red-700" /></div>
                      <h3 className="text-2xl font-black text-slate-950">{title}</h3>
                    </div>
                    <p className="mt-4 text-base leading-7 text-slate-700">{description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-base font-extrabold text-brand-red-700">Learn more <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">How the System Works</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Training is only one part of the pathway.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-800">
              Elevate helps participants identify a career goal, review program and funding options, complete required training and credentials, and prepare for employment or work-based learning. Delivery varies by program, and hands-on requirements are completed at approved or applicable training locations.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-700">
              Supportive services may be provided directly, coordinated with partners, or referred to community resources depending on participant need, program rules, and available resources. Elevate does not guarantee funding, employment, certification, licensure, wages, or supportive-service approval.
            </p>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <Building2 className="h-7 w-7 text-orange-300" />
              <h2 className="text-2xl font-black">Organization Information</h2>
            </div>
            <dl className="mt-6 space-y-5 text-base">
              <div><dt className="font-extrabold text-white">Operating organization</dt><dd className="mt-1 text-slate-200">{organization.legalName}, DBA {organization.dbaName}</dd></div>
              <div><dt className="font-extrabold text-white">Administrative address</dt><dd className="mt-1 text-slate-200">{organization.address}</dd></div>
              <div><dt className="font-extrabold text-white">Phone</dt><dd className="mt-1 text-slate-200">{organization.phone}</dd></div>
              <div><dt className="font-extrabold text-white">Hours</dt><dd className="mt-1 text-slate-200">{organization.hours.weekdays}; {organization.hours.saturday}</dd></div>
              <div><dt className="font-extrabold text-white">Registered Apprenticeship</dt><dd className="mt-1 text-slate-200">RAPIDS Sponsor ID {organization.approvals.registeredApprenticeship.rapidsId}</dd></div>
              <div><dt className="font-extrabold text-white">Job Ready Indy</dt><dd className="mt-1 text-slate-200">{organization.approvals.jobReadyIndy.status}</dd></div>
            </dl>
            <Link href="/compliance/center" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-extrabold text-slate-950 hover:bg-slate-100">
              Verify Elevate <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>

      <section className="bg-brand-red-700 px-6 py-14 text-white sm:py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
          <div>
            <h2 className="text-3xl font-black sm:text-4xl">Ready to choose your next step?</h2>
            <p className="mt-3 text-lg text-white/90">Explore programs or speak with Elevate about the pathway that fits your goals.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/programs" className="rounded-xl bg-white px-7 py-4 text-lg font-extrabold text-brand-red-700 hover:bg-slate-100">View Programs</Link>
            <Link href="/contact" className="rounded-xl border-2 border-white px-7 py-4 text-lg font-extrabold text-white hover:bg-white/10">Contact Elevate</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
