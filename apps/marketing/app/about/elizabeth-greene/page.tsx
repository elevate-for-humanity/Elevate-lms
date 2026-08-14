import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2, ExternalLink, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { organization } from '@/lib/config/organization';

const siteUrl = 'https://www.elevateforhumanity.org';
const canonicalUrl = `${siteUrl}${organization.founder.canonicalPath}`;
const founderImage = `${siteUrl}${organization.founder.imagePath}`;

export const metadata: Metadata = {
  title: {
    absolute: 'Elizabeth Greene | Founder & CEO of Elevate for Humanity',
  },
  description:
    'Elizabeth Greene is the Founder and Chief Executive Officer of Elevate for Humanity Career & Technical Institute in Indianapolis, Indiana, where she leads workforce training, apprenticeship, employer, and digital-platform operations.',
  alternates: { canonical: canonicalUrl },
  keywords: [
    'Elizabeth Greene',
    'Elizabeth Greene Elevate for Humanity',
    'Elevate for Humanity founder',
    'workforce development Indianapolis',
    'registered apprenticeship Indianapolis',
  ],
  openGraph: {
    title: 'Elizabeth Greene | Founder & CEO of Elevate for Humanity',
    description:
      'Founder and Chief Executive Officer of Elevate for Humanity Career & Technical Institute in Indianapolis, Indiana.',
    url: canonicalUrl,
    images: [
      {
        url: founderImage,
        alt: 'Elizabeth Greene, Founder and CEO of Elevate for Humanity',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elizabeth Greene | Founder & CEO of Elevate for Humanity',
    description:
      'Founder and Chief Executive Officer of Elevate for Humanity Career & Technical Institute in Indianapolis, Indiana.',
    images: [founderImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const founderJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfilePage',
      '@id': `${canonicalUrl}#profile`,
      url: canonicalUrl,
      name: 'Elizabeth Greene | Founder & CEO of Elevate for Humanity',
      mainEntity: { '@id': `${canonicalUrl}#person` },
      about: { '@id': `${canonicalUrl}#person` },
    },
    {
      '@type': 'Person',
      '@id': `${canonicalUrl}#person`,
      name: organization.founder.name,
      jobTitle: organization.founder.title,
      description:
        'Founder and Chief Executive Officer of Elevate for Humanity Career & Technical Institute, focused on workforce development, career and technical education, Registered Apprenticeship, employer partnerships, and workforce training operations.',
      url: canonicalUrl,
      image: {
        '@type': 'ImageObject',
        url: founderImage,
        contentUrl: founderImage,
      },
      homeLocation: {
        '@type': 'Place',
        name: organization.founder.location,
      },
      worksFor: {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Elevate for Humanity Career & Technical Institute',
        url: siteUrl,
      },
      sameAs: [organization.founder.linkedIn],
      knowsAbout: [
        'Workforce Development',
        'Career and Technical Education',
        'Registered Apprenticeship',
        'Work-Based Learning',
        'Employer Partnerships',
        'Workforce Training Operations',
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'About',
          item: `${siteUrl}/about`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Elizabeth Greene',
          item: canonicalUrl,
        },
      ],
    },
  ],
};

export default function ElizabethGreenePage() {
  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderJsonLd) }}
      />

      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'About Us', href: '/about' },
              { label: 'Elizabeth Greene' },
            ]}
          />
        </div>
      </div>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative min-h-[420px] overflow-hidden rounded-3xl shadow-2xl sm:min-h-[520px]">
            <Image
              src={organization.founder.imagePath}
              alt="Elizabeth Greene, Founder and CEO of Elevate for Humanity"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover object-top"
            />
          </div>

          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-orange-300">
              Founder & Leadership
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Elizabeth Greene
            </h1>
            <p className="mt-4 text-2xl font-bold text-white">
              Founder &amp; Chief Executive Officer, Elevate for Humanity
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">
              Elizabeth Greene founded Elevate for Humanity to connect career training with the workforce systems that determine whether participants can successfully move from interest to enrollment, work-based learning, credentials, and employment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3.5 font-extrabold text-white hover:bg-brand-red-700"
              >
                About Elevate <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={organization.founder.linkedIn}
                target="_blank"
                rel="noopener noreferrer me"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/60 px-6 py-3.5 font-extrabold text-white hover:bg-slate-800"
              >
                LinkedIn <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="space-y-6 text-lg leading-8 text-slate-800">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
                Leadership Focus
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Building the operational bridge between training and opportunity
              </h2>
            </div>

            <p>
              Greene&apos;s leadership focus is operational. Elevate brings together career and technical training, Registered Apprenticeship, testing, workforce-funding navigation, employer participation, participant support, and digital systems intended to coordinate those activities across the learner journey.
            </p>
            <p>
              Her work includes developing training pathways, employer and host-site relationships, administrative workflows, compliance processes, and the technology used to connect applicants, learners, apprentices, employers, workforce partners, instructors, and staff.
            </p>
            <p>
              Elevate for Humanity is based in Indianapolis, Indiana and serves learners and workforce partners through program-specific training, apprenticeship, testing, employer, and support pathways.
            </p>

            <div className="grid gap-4 pt-4 sm:grid-cols-2">
              <Link
                href="/apprenticeships"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-brand-red-300 hover:bg-white hover:shadow-md"
              >
                <ShieldCheck className="h-6 w-6 text-brand-red-700" />
                <h3 className="mt-3 text-xl font-black text-slate-950">Registered Apprenticeship</h3>
                <p className="mt-2 text-base leading-7 text-slate-700">
                  Review Elevate&apos;s apprenticeship pathways and sponsor operations.
                </p>
              </Link>
              <Link
                href="/platform"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-brand-red-300 hover:bg-white hover:shadow-md"
              >
                <Building2 className="h-6 w-6 text-brand-red-700" />
                <h3 className="mt-3 text-xl font-black text-slate-950">Workforce Platform</h3>
                <p className="mt-2 text-base leading-7 text-slate-700">
                  See the digital operating system supporting Elevate&apos;s workforce model.
                </p>
              </Link>
            </div>
          </article>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">At a glance</h2>
            <dl className="mt-6 space-y-5 text-base">
              <div>
                <dt className="font-extrabold text-slate-950">Name</dt>
                <dd className="mt-1 text-slate-700">{organization.founder.name}</dd>
              </div>
              <div>
                <dt className="font-extrabold text-slate-950">Role</dt>
                <dd className="mt-1 text-slate-700">{organization.founder.title}</dd>
              </div>
              <div>
                <dt className="font-extrabold text-slate-950">Organization</dt>
                <dd className="mt-1 text-slate-700">Elevate for Humanity Career &amp; Technical Institute</dd>
              </div>
              <div>
                <dt className="font-extrabold text-slate-950">Location</dt>
                <dd className="mt-1 text-slate-700">{organization.founder.location}</dd>
              </div>
              <div>
                <dt className="font-extrabold text-slate-950">Public professional profile</dt>
                <dd className="mt-1">
                  <a
                    href={organization.founder.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="font-bold text-brand-red-700 hover:underline"
                  >
                    LinkedIn
                  </a>
                </dd>
              </div>
            </dl>

            <Link
              href="/compliance/center"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-extrabold text-white hover:bg-slate-800"
            >
              Organization verification <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
