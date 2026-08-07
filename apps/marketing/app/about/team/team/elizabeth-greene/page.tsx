export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const SITE_URL = 'https://www.elevateforhumanity.org';
const PROFILE_URL = `${SITE_URL}/about/team/team/elizabeth-greene`;

export const metadata: Metadata = {
  title: 'Elizabeth Greene | Founder & CEO of Elevate for Humanity',
  description:
    'Elizabeth Greene is the Founder and CEO of Elevate for Humanity, an Indianapolis workforce development and career training organization focused on funded training, registered apprenticeships, testing, and career pathways.',
  alternates: {
    canonical: PROFILE_URL,
  },
  openGraph: {
    title: 'Elizabeth Greene | Founder & CEO of Elevate for Humanity',
    description:
      'Meet Elizabeth Greene, Founder and CEO of Elevate for Humanity in Indianapolis, Indiana.',
    url: PROFILE_URL,
    siteName: 'Elevate for Humanity',
    type: 'profile',
    images: [
      {
        url: `${SITE_URL}/images/team/elizabeth-greene-headshot.webp`,
        width: 1200,
        height: 1200,
        alt: 'Elizabeth Greene, Founder and CEO of Elevate for Humanity',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elizabeth Greene | Founder & CEO of Elevate for Humanity',
    description:
      'Founder and CEO of Elevate for Humanity, an Indianapolis workforce development and career training organization.',
    images: [`${SITE_URL}/images/team/elizabeth-greene-headshot.webp`],
  },
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${PROFILE_URL}#person`,
  name: 'Elizabeth Greene',
  url: PROFILE_URL,
  image: `${SITE_URL}/images/team/elizabeth-greene-headshot.webp`,
  jobTitle: 'Founder and Chief Executive Officer',
  worksFor: {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Elevate for Humanity',
    url: SITE_URL,
  },
  founder: {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Elevate for Humanity',
    url: SITE_URL,
  },
  knowsAbout: [
    'Workforce development',
    'Career and technical education',
    'Registered apprenticeships',
    'Workforce funding navigation',
    'Career certification programs',
    'Testing and credentialing operations',
  ],
};

export default function Page() {
  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'About', href: '/about' },
            { label: 'Team', href: '/about/team' },
            { label: 'Elizabeth Greene' },
          ]}
        />
      </div>

      <section className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:py-16">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-900 shadow-2xl">
            <Image
              src="/images/team/elizabeth-greene-headshot.webp"
              alt="Elizabeth Greene, Founder and CEO of Elevate for Humanity"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>

          <div>
            <Link
              href="/about/team"
              className="mb-7 inline-flex items-center text-sm font-semibold text-slate-300 hover:text-white"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Team
            </Link>

            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-orange-300">
              Founder & Chief Executive Officer
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Elizabeth Greene
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              Elizabeth Greene is the Founder and Chief Executive Officer of{' '}
              {PLATFORM_DEFAULTS.orgName} Career & Technical Institute, an
              Indianapolis workforce development and career training
              organization.
            </p>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
              Her work focuses on creating clearer pathways between career
              training, public workforce funding, industry credentials,
              registered apprenticeships, testing, employers, and participant
              support systems.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr]">
          <article>
            <h2 className="text-3xl font-black text-slate-950">
              Workforce development leadership
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-8 text-slate-700">
              <p>
                Greene founded Elevate for Humanity to help people move from
                interest in a career to a defined training, credentialing, and
                employment pathway without requiring a traditional college
                degree route.
              </p>
              <p>
                Elevate operates career and technical training programs and
                coordinates workforce services that include funding navigation,
                registered apprenticeship, employer engagement, credential
                preparation, testing, and participant support.
              </p>
              <p>
                Elevate maintains Indiana workforce program approvals and is an
                approved Job Ready Indy provider. Its apprenticeship work also
                includes U.S. Department of Labor Registered Apprenticeship
                sponsorship and related employer and training-site coordination.
              </p>
            </div>

            <h2 className="mt-12 text-3xl font-black text-slate-950">
              Leadership focus
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                'Workforce development program design and administration',
                'Registered apprenticeship sponsorship and coordination',
                'Career certification and testing partnerships',
                'WIOA, Workforce Ready Grant, and Job Ready Indy navigation',
                'Employer and training-provider partnerships',
                'Technology supporting enrollment, training, and compliance workflows',
              ].map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-700" />
                  <span className="font-medium text-slate-800">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <h2 className="text-2xl font-black text-slate-950">
                About Elevate for Humanity
              </h2>
              <p className="mt-3 leading-7 text-slate-700">
                Elevate for Humanity is a workforce development and career
                training organization based in Indianapolis, Indiana. It focuses
                on career pathways, occupational training, apprenticeships,
                testing, funding navigation, and employer connections.
              </p>
              <Link
                href="/about"
                className="mt-5 inline-flex items-center gap-2 font-bold text-blue-800 hover:underline"
              >
                Learn more about Elevate for Humanity
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </article>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-blue-700" />
              <h2 className="text-xl font-black text-slate-950">
                Official information
              </h2>
            </div>
            <p className="mt-4 leading-7 text-slate-700">
              Use Elevate&apos;s official pages and the responsible government or
              credentialing organization to verify program approvals,
              apprenticeships, testing relationships, and funding eligibility.
            </p>
            <nav className="mt-6 space-y-3" aria-label="Official verification links">
              <Link
                href="/compliance/center"
                className="block rounded-lg border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 hover:border-slate-400"
              >
                Compliance Center
              </Link>
              <Link
                href="/apprenticeships"
                className="block rounded-lg border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 hover:border-slate-400"
              >
                Registered Apprenticeships
              </Link>
              <Link
                href="/jri"
                className="block rounded-lg border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 hover:border-slate-400"
              >
                Job Ready Indy / JRI
              </Link>
              <Link
                href="/programs"
                className="block rounded-lg border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 hover:border-slate-400"
              >
                Career Programs
              </Link>
              <Link
                href="/contact"
                className="block rounded-lg border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 hover:border-slate-400"
              >
                Contact Elevate
              </Link>
            </nav>
          </aside>
        </div>
      </section>
    </main>
  );
}
