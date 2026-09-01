import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  GraduationCap,
  Handshake,
  ShieldCheck,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { organization } from '@/lib/config/organization';

export const metadata: Metadata = {
  title: 'About Elevate for Humanity | Elizabeth Greene & Workforce Development',
  description:
    'Meet Elizabeth Greene, Founder and CEO of Elevate for Humanity, and learn how Elevate connects workforce training, registered apprenticeship, testing, funding navigation, employer partnerships, and technology in Indianapolis.',
  keywords: [
    'Elizabeth Greene Elevate for Humanity',
    'workforce development Indianapolis',
    'registered apprenticeship Indiana',
    'career training Indianapolis',
    'WIOA training provider Indiana',
  ],
  alternates: { canonical: 'https://www.elevateforhumanity.org/about' },
  openGraph: {
    type: 'profile',
    url: 'https://www.elevateforhumanity.org/about',
    title: 'Elizabeth Greene & Elevate for Humanity Workforce Development',
    description:
      'Meet Elizabeth Greene and explore Elevate for Humanity career training, registered apprenticeship, workforce funding navigation, testing, and employer partnerships in Indianapolis.',
    images: [
      {
        url: '/images/team/elizabeth-greene.webp',
        width: 1200,
        height: 1200,
        alt: 'Elizabeth Greene, Founder and CEO of Elevate for Humanity workforce development organization in Indianapolis',
      },
    ],
  },
};

const founderCredentials = [
  'U.S. Army Veteran — Unit Supply Specialist',
  'IRS Enrolled Agent (EA) — Federally Authorized Tax Practitioner',
  'Electronic Filing Identification Number (EFIN) holder',
  'Preparer Tax Identification Number (PTIN) holder',
  'Electronic Return Originator (ERO)',
  'SBIN-authorized federal tax software submitter',
  'Indiana Licensed Barber — Indiana Professional Licensing Agency',
  'Indiana Substitute Teacher License',
  'OSHA 10-Hour Safety Certification',
  'EPA Section 608 Certified Proctor — ESCO Group (#358010)',
  'EPA Section 608 Certified Proctor — Mainstream Engineering',
  'Certiport Authorized Testing Center (CATC) Owner and Operator',
  'Microsoft Office Specialist Exam Proctor',
  'IC3 Digital Literacy Exam Proctor',
  'Information Technology Specialist Exam Proctor',
  'Entrepreneurship and Small Business Exam Proctor',
  'Intuit QuickBooks Certification Exam Proctor',
];

const organizationApprovals = [
  'U.S. Department of Labor Registered Apprenticeship Sponsor',
  'Indiana Eligible Training Provider List (ETPL) provider',
  'Workforce Ready Grant approved provider/program pathways',
  'WIOA workforce funding pathways',
  'Job Ready Indy approved/partner pathways',
  'WorkOne workforce partner relationships',
  'SAM.gov registered federal contractor organization',
  'Indiana state bidder registration',
  'ByBlack certified business recognition',
  'CareerSafe OSHA training provider relationship',
  'HSI affiliate relationship',
  'NRF RISE Up provider relationship',
];

const capabilities = [
  {
    title: 'Career & Technical Training',
    description:
      'Explore healthcare, skilled trades, transportation, technology, business, and other career pathways.',
    icon: GraduationCap,
    href: '/programs',
    image: '/images/pages/cna-nursing-real.webp',
    imageAlt:
      'Career and technical training for healthcare and workforce careers at Elevate for Humanity in Indianapolis',
  },
  {
    title: 'Registered Apprenticeship',
    description: `Structured work-based learning coordinated through RAPIDS Sponsor ID ${organization.approvals.registeredApprenticeship.rapidsId}.`,
    icon: ShieldCheck,
    href: '/apprenticeships',
    image: '/images/pages/apprenticeships-page-1.webp',
    imageAlt:
      'Registered apprenticeship and work-based learning pathway through Elevate for Humanity in Indiana',
  },
  {
    title: 'Funding Navigation',
    description:
      'Understand potential WIOA, Workforce Ready Grant, and other workforce funding pathways before enrollment.',
    icon: CheckCircle2,
    href: '/funding',
    image: '/images/pages/funding-impact-1.webp',
    imageAlt:
      'WIOA and Workforce Ready Grant funding navigation for career training in Indiana',
  },
  {
    title: 'Employer Partnerships',
    description:
      'Connect training, apprenticeship host sites, work-based learning, and employer talent needs.',
    icon: Handshake,
    href: '/employers',
    image: '/images/pages/about-employer-partners.webp',
    imageAlt:
      'Employer partnerships, apprenticeship host sites, and workforce talent development in Indianapolis',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'About Us' }]} />
        </div>
      </div>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-amber-300">
              Indianapolis, Indiana
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              A workforce system built from lived experience, public-service discipline, and operational execution.
            </h1>
            <p className="mt-6 max-w-3xl text-xl font-medium leading-8 text-slate-100 sm:text-2xl sm:leading-9">
              Elevate for Humanity connects career training, registered apprenticeship, testing,
              workforce funding navigation, employer partnerships, participant support, and digital
              infrastructure in one operating model.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-7 py-4 text-lg font-extrabold text-white hover:bg-brand-red-700"
              >
                Explore Programs <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/about/elizabeth-greene"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white px-7 py-4 text-lg font-extrabold text-white hover:bg-white/10"
              >
                Meet Elizabeth Greene
              </Link>
            </div>
          </div>

          <div className="relative min-h-[390px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl sm:min-h-[520px]">
            <Image
              src="/images/team/elizabeth-greene.webp"
              alt="Elizabeth Greene, Founder and CEO of Elevate for Humanity workforce development organization in Indianapolis"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover object-top"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
              Founder &amp; Chief Executive Officer
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Elizabeth Greene
            </h2>
            <p className="mt-4 text-xl font-bold leading-8 text-slate-800">
              Veteran. Federally authorized tax professional. Licensed barber. Educator. Testing
              proctor. Workforce-system founder. Self-taught platform builder.
            </p>
            <Link
              href="/about/elizabeth-greene"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-extrabold text-white hover:bg-slate-800"
            >
              Full founder profile <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-6 text-lg leading-8 text-slate-800">
            <p>
              Elizabeth Greene founded Elevate for Humanity after working across systems that often
              operate separately even though participants experience them as one journey: training,
              workforce funding, credential testing, apprenticeship, employer participation,
              compliance, tax and financial administration, and community support.
            </p>
            <p>
              Her background crosses military logistics, federal tax practice, licensed barbering,
              education, skilled-trades testing, workforce development, nonprofit operations, and
              technology. Rather than treating those disciplines as separate projects, she built
              Elevate around the practical problem of moving a person from interest to eligibility,
              training, work-based learning, credential attainment, and employment.
            </p>
            <p>
              As Elevate&apos;s founder and owner, Greene personally designed and built the public
              website and the integrated workforce technology platform as a self-taught software
              developer. She built the applicant intake, learning management, course studio,
              apprenticeship tracking, employer and host-shop portals, compliance workflows,
              testing-center operations, reporting, and administrative systems that run the
              organization.
            </p>
            <p>
              Greene also established and leads Elevate&apos;s U.S. Department of Labor Registered
              Apprenticeship sponsorship through 2Exclusive LLC-S, RAPIDS Sponsor ID
              2025-IN-132301. She oversees the apprenticeship programs, related technical
              instruction, host-site participation, apprentice progress, wage schedules, and
              sponsor compliance.
            </p>
            <p>
              She also leads Selfish Inc., a 501(c)(3) nonprofit connected to community support and
              VITA free tax preparation services, and oversees Elevate tax operations.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-amber-300">
              Elizabeth Greene — Credentials
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Personal licenses, credentials, and testing authorizations
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-200">
              These are Elizabeth Greene&apos;s personal licenses, credentials, certifications, and
              professional authorizations. Elevate&apos;s organizational approvals and relationships
              are listed separately below.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {founderCredentials.map((credential) => (
              <div
                key={credential}
                className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-5"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <p className="font-bold leading-7 text-white">{credential}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
                Institutional Standing
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Approvals and relationships held by Elevate
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                These are organizational approvals, registrations, provider statuses, or partner
                relationships associated with Elevate&apos;s operations. They are intentionally not
                represented as Elizabeth Greene&apos;s personal licenses.
              </p>
              <Link
                href="/compliance/center"
                className="mt-7 inline-flex items-center gap-2 rounded-xl border-2 border-slate-950 px-5 py-3 font-extrabold text-slate-950 hover:bg-slate-50"
              >
                Review compliance center <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {organizationApprovals.map((approval) => (
                <div
                  key={approval}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-red-700" />
                  <p className="font-bold leading-7 text-slate-900">{approval}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
              What Elevate Does
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              One organization. Multiple entry points.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Applicants, employers, apprentices, testing candidates, and workforce partners should
              be able to immediately see where they fit.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {capabilities.map(({ title, description, icon: Icon, href, image, imageAlt }) => (
              <article
                key={title}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <Link href={href} className="block">
                  <div className="relative h-56 overflow-hidden sm:h-64">
                    <Image
                      src={image}
                      alt={imageAlt}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-brand-red-50 p-2.5">
                        <Icon className="h-6 w-6 text-brand-red-700" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-950">{title}</h3>
                    </div>
                    <p className="mt-4 text-base leading-7 text-slate-700">{description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-base font-extrabold text-brand-red-700">
                      Learn more <ArrowRight className="h-4 w-4" />
                    </span>
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
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
              How the System Works
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Training is only one part of the pathway.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-800">
              Elevate helps participants identify a career goal, review program and funding options,
              complete required training and credentials, and prepare for employment or work-based
              learning. Delivery varies by program, and hands-on requirements are completed at
              approved or applicable training locations.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-700">
              Supportive services may be provided directly, coordinated with partners, or referred
              to community resources depending on participant need, program rules, and available
              resources. Elevate does not guarantee funding, employment, certification, licensure,
              wages, or supportive-service approval.
            </p>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <Building2 className="h-7 w-7 text-amber-300" />
              <h2 className="text-2xl font-black text-white">Organization Information</h2>
            </div>
            <dl className="mt-6 space-y-5 text-base">
              <div>
                <dt className="font-extrabold text-white">Operating organization</dt>
                <dd className="mt-1 text-slate-200">
                  {organization.legalName}, DBA {organization.dbaName}
                </dd>
              </div>
              <div>
                <dt className="font-extrabold text-white">Administrative address</dt>
                <dd className="mt-1 text-slate-200">{organization.address}</dd>
              </div>
              <div>
                <dt className="font-extrabold text-white">Phone</dt>
                <dd className="mt-1 text-slate-200">{organization.phone}</dd>
              </div>
              <div>
                <dt className="font-extrabold text-white">Hours</dt>
                <dd className="mt-1 text-slate-200">
                  {organization.hours.weekdays}; {organization.hours.saturday}
                </dd>
              </div>
              <div>
                <dt className="font-extrabold text-white">Registered Apprenticeship</dt>
                <dd className="mt-1 text-slate-200">
                  RAPIDS Sponsor ID {organization.approvals.registeredApprenticeship.rapidsId}
                </dd>
              </div>
              <div>
                <dt className="font-extrabold text-white">Job Ready Indy</dt>
                <dd className="mt-1 text-slate-200">
                  {organization.approvals.jobReadyIndy.status}
                </dd>
              </div>
            </dl>
            <Link
              href="/compliance/center"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-extrabold text-slate-950 hover:bg-slate-100"
            >
              Verify Elevate <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>

      <section className="bg-brand-red-800 px-6 py-14 text-white sm:py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
          <div>
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Ready to choose your next step?
            </h2>
            <p className="mt-3 text-lg text-white">
              Explore programs or speak with Elevate about the pathway that fits your goals.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/programs"
              className="rounded-xl bg-white px-7 py-4 text-lg font-extrabold text-brand-red-800 hover:bg-slate-100"
            >
              View Programs
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border-2 border-white px-7 py-4 text-lg font-extrabold text-white hover:bg-white/10"
            >
              Contact Elevate
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
