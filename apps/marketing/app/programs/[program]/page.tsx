import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';

import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import heroBanners, { type HeroBannerConfig } from '@/content/heroBanners';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { loadProgramForPage, loadProgramMetadataSource } from '@/lib/programs/load-program-page';
import { getProgramOgImageUrl } from '@/lib/programs/og-images';
import Link from 'next/link';
import { EMPLOYER_TALENT_PATHWAYS } from '@/lib/marketing/employer-talent-network';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ program: string }>;
}): Promise<Metadata> {
  const { program } = await params;
  const source = await loadProgramMetadataSource(program);
  if (!source) return { robots: { index: false, follow: false } };

  const canonical = `${PLATFORM_DEFAULTS.siteUrl}/programs/${program}`;
  const image = source.image?.startsWith('http')
    ? source.image
    : source.image
      ? `${PLATFORM_DEFAULTS.siteUrl}${source.image}`
      : getProgramOgImageUrl(program, PLATFORM_DEFAULTS.siteUrl);

  return {
    title: source.title,
    description: source.description,
    alternates: { canonical },
    openGraph: {
      title: source.title,
      description: source.description,
      url: canonical,
      siteName: PLATFORM_DEFAULTS.orgName,
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: source.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: source.title,
      description: source.description,
      images: [image],
    },
  };
}

export default async function PublicProgramPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  const loaded = await loadProgramForPage(program);
  if (!loaded) return notFound();

  const resolved = loaded.program;
  if (resolved.slug !== program) {
    permanentRedirect(`/programs/${resolved.slug}`);
  }

  const price = Number.parseInt(resolved.selfPayCost.replace(/[^0-9]/g, ''), 10);
  const isBusinessProgram = resolved.slug === 'business-administration';
  const isBookkeepingProgram = resolved.slug === 'bookkeeping';
  const employerPathway = EMPLOYER_TALENT_PATHWAYS.find(
    (item) => item.programSlug === resolved.slug,
  );
  const configuredBanner = isBusinessProgram ? null : (heroBanners[resolved.slug] ?? null);
  const banner: HeroBannerConfig = isBusinessProgram
    ? {
        pageKey: resolved.slug,
        posterImage: resolved.heroImage,
        microLabel: '5-Week Funded Business Training',
        belowHeroHeadline: 'Business & Entrepreneurship — 5 Weeks',
        belowHeroSubheadline:
          'Indiana INTraining Program #10005173. Build entrepreneurship, small-business, customer service, retail operations, sales, and practical business-finance skills while preparing for ESB and Business of Retail industry credentials. Workforce funding may cover approved training costs for eligible participants with agency authorization.',
        primaryCta: {
          label: 'Apply Now',
          href: resolved.cta.applyHref,
          variant: 'primary',
        },
        secondaryCta: {
          label: 'Check Funding Eligibility',
          href: '/check-eligibility',
          variant: 'secondary',
        },
        trustIndicators: [
          '5-Week Program',
          'INTraining #10005173',
          'Funding Available for Eligible Participants',
          'ESB + Business of Retail Credential Preparation',
        ],
        analyticsName: `program-${resolved.slug}`,
        transcript:
          'Business and Entrepreneurship is a five-week Indiana workforce training program. Learners build entrepreneurship, small-business, customer service, retail operations, sales, pricing, profit, cash-flow, and business-planning skills while preparing for Entrepreneurship and Small Business and Business of Retail credential assessments. Funding requires participant eligibility and written agency authorization.',
      }
    : configuredBanner?.pageKey
      ? configuredBanner
      : {
          pageKey: resolved.slug,
          posterImage: resolved.heroImage,
          microLabel: resolved.category || resolved.programType,
          belowHeroHeadline: resolved.title,
          belowHeroSubheadline: resolved.subtitle,
          primaryCta: {
            label: 'Apply Now',
            href: resolved.cta.applyHref,
            variant: 'primary',
          },
          secondaryCta: {
            label: 'Request Information',
            href:
              resolved.cta.requestInfoHref ||
              `/contact?program=${encodeURIComponent(resolved.slug)}`,
            variant: 'secondary',
          },
          analyticsName: `program-${resolved.slug}`,
          transcript: `${resolved.title}. ${resolved.subtitle}`,
        };

  return (
    <>
      <ProgramStructuredData
        program={{
          id: resolved.slug,
          name: resolved.title,
          slug: resolved.slug,
          description: resolved.subtitle,
          duration_weeks: resolved.durationWeeks,
          price: Number.isFinite(price) ? price : null,
          image_url: resolved.heroImage,
          category: resolved.category,
          outcomes: resolved.outcomes.map((outcome) => outcome.statement),
          funding_eligible: !resolved.isSelfPay,
        }}
      />
      <ProgramDetailPage
        program={resolved}
        banner={banner}
        heroOverride={
          isBookkeepingProgram ? (
            <div className="w-full overflow-hidden bg-white">
              <Image
                src="/images/heroes/bookkeeping-accounting-financial-empowerment.png"
                alt="Accounting and Financial Empowerment Career Pathway Program led by Dr. Carlina A. Wilkes"
                width={1536}
                height={1152}
                priority
                sizes="100vw"
                className="h-auto w-full"
              />
            </div>
          ) : undefined
        }
      />
      {employerPathway ? (
        <section className="border-t border-slate-200 bg-slate-950 px-4 py-12 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                For employers
              </p>
              <h2 className="mt-2 text-3xl font-black">
                Need emerging {employerPathway.name.toLowerCase()} talent?
              </h2>
              <p className="mt-2 max-w-2xl leading-7 text-slate-200">
                Review candidate skills, potential roles, regional pages, and the employer
                partnership process.
              </p>
            </div>
            <Link
              href={`/employers/talent-network/${employerPathway.slug}`}
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3 font-black text-slate-950"
            >
              Open Employer Network
            </Link>
          </div>
        </section>
      ) : null}
      {resolved.slug === 'cpr-first-aid' ? (
        <section
          aria-labelledby="cpr-provider-contact"
          className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
              CPR training contact
            </p>
            <h2 id="cpr-provider-contact" className="mt-2 text-2xl font-bold text-slate-950">
              Sharon Douglas — CentTech
            </h2>
            <dl className="mt-5 grid gap-4 text-base text-slate-700 sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-slate-950">Email</dt>
                <dd className="mt-1">
                  <a
                    className="font-medium text-blue-700 underline"
                    href="mailto:sharen710@gmail.com"
                  >
                    info@centtech.org
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-950">Phone</dt>
                <dd className="mt-1">
                  <a className="font-medium text-blue-700 underline" href="tel:+13176467806">
                    317-646-7806
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-950">Website</dt>
                <dd className="mt-1">
                  <a
                    className="font-medium text-blue-700 underline"
                    href="https://www.centtech.org"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    www.centtech.org
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </section>
      ) : null}
    </>
  );
}
