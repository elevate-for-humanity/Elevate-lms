import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, GraduationCap, Handshake, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { organization } from '@/lib/config/organization';

export const metadata: Metadata = {
  title: 'About Elevate for Humanity | Indianapolis Workforce Development',
  description:
    'Elevate for Humanity is an Indianapolis workforce development and career training organization supporting occupational training, registered apprenticeships, testing, funding navigation, and employer connections.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/about' },
};

const capabilities = [
  {
    title: 'Career & technical training',
    description:
      'Career pathways include healthcare, skilled trades, transportation, technology, business, and apprenticeship programs. Program length, delivery model, credentials, and eligibility vary by program.',
    icon: GraduationCap,
    href: '/programs',
  },
  {
    title: 'Registered apprenticeship',
    description:
      `Elevate coordinates registered apprenticeship activity through sponsor ${organization.approvals.registeredApprenticeship.sponsorName}, RAPIDS Sponsor ID ${organization.approvals.registeredApprenticeship.rapidsId}.`,
    icon: ShieldCheck,
    href: '/apprenticeships',
  },
  {
    title: 'Funding navigation',
    description:
      'Elevate helps applicants understand potential workforce funding pathways. Final eligibility, authorization, covered costs, and available funding are determined by the responsible agency or funding source.',
    icon: CheckCircle2,
    href: '/funding',
  },
  {
    title: 'Employer & workforce coordination',
    description:
      'Elevate works with employers, apprenticeship host sites, workforce organizations, and training partners to support participant pathways and work-based learning.',
    icon: Handshake,
    href: '/employers',
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

      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900 shadow-2xl">
            <Image
              src="/images/team/elizabeth-greene.webp"
              alt="Elizabeth Greene, Founder and CEO of Elevate for Humanity"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 35vw"
              className="object-cover object-top"
            />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">Indianapolis, Indiana</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">About Elevate for Humanity</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
              Elevate for Humanity is a workforce development and career training organization connecting people with training pathways, industry credentials, registered apprenticeship opportunities, funding navigation, testing, and employer support.
            </p>
            <p className="mt-5 text-slate-300">
              Founder &amp; CEO: <strong className="text-white">Elizabeth Greene</strong>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <article>
            <h2 className="text-3xl font-black text-slate-950">What we do</h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Elevate focuses on helping participants move through a defined workforce pathway: identify a career goal, review program and funding options, complete required training and credentials, and prepare for employment or work-based learning.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {capabilities.map(({ title, description, icon: Icon, href }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <Icon className="h-7 w-7 text-brand-red-600" />
                  <h3 className="mt-4 text-xl font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 leading-7 text-slate-700">{description}</p>
                  <Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-red-700 hover:underline">
                    Learn more <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </article>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Building2 className="h-7 w-7 text-brand-blue-700" />
              <h2 className="text-xl font-black text-slate-950">Organization information</h2>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-bold text-slate-950">Operating organization</dt>
                <dd className="mt-1 text-slate-700">{organization.legalName}, DBA {organization.dbaName}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-950">Administrative address</dt>
                <dd className="mt-1 text-slate-700">{organization.address}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-950">Phone</dt>
                <dd className="mt-1 text-slate-700">{organization.phone}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-950">Hours</dt>
                <dd className="mt-1 text-slate-700">{organization.hours.weekdays}; {organization.hours.saturday}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-950">Registered Apprenticeship</dt>
                <dd className="mt-1 text-slate-700">RAPIDS Sponsor ID {organization.approvals.registeredApprenticeship.rapidsId}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-950">Job Ready Indy</dt>
                <dd className="mt-1 text-slate-700">{organization.approvals.jobReadyIndy.status}</dd>
              </div>
            </dl>
            <Link href="/compliance/center" className="mt-6 inline-flex items-center gap-2 font-bold text-brand-blue-700 hover:underline">
              Compliance &amp; verification <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-3xl font-black text-slate-950">Training delivery</h2>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-700">
            Training delivery varies by program. Online instruction may be delivered through Elevate&apos;s learning platform, while clinical, laboratory, apprenticeship, driving, shop, and other hands-on requirements are completed at approved or applicable training locations. The specific program page and enrollment documents control when requirements differ.
          </p>
          <p className="mt-4 max-w-4xl leading-7 text-slate-700">
            Supportive services may be provided directly, coordinated with partners, or referred to community resources depending on participant need, program rules, and available resources. Elevate does not guarantee funding, employment, certification, licensure, wages, or supportive-service approval.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14 text-center">
        <h2 className="text-3xl font-black text-slate-950">Verify before you enroll</h2>
        <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-700">
          Current program status, funding eligibility, credential requirements, testing authorization, and apprenticeship information should be verified through Elevate&apos;s current program records and, when applicable, the responsible government or credentialing organization.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/programs" className="rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white hover:bg-brand-red-700">View Programs</Link>
          <Link href="/contact" className="rounded-lg border border-slate-300 px-7 py-3 font-bold text-slate-900 hover:bg-slate-50">Contact Elevate</Link>
        </div>
      </section>
    </main>
  );
}
