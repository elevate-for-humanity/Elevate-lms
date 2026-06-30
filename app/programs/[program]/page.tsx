import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 3600; // program detail pages are static content — revalidate hourly
import { createPublicClient } from '@/lib/supabase/public';
import { programs as staticPrograms } from '@/content/cf-programs';
import { getStaticProgram } from '@/data/programs/index';
import ProgramDetailPageComponent from '@/components/programs/ProgramDetailPage';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import { OnetLaborData } from '@/components/programs/onet/OnetLaborData';
import { getProgramOgImageUrl } from '@/lib/programs/og-images';
import heroBanners from '@/content/heroBanners';
import HeroVideo from '@/components/marketing/HeroVideo';
import HeroPicture from '@/components/marketing/HeroPicture';
import { DEFAULT_HERO_VIDEO, resolveHeroPosterSrc } from '@/lib/images/hero-banner-media';
import { hero as heroTokens } from '@/lib/page-design-tokens';
import { getProgramOgImage } from '@/lib/programs/og-images';
import { CheckCircle, Clock, Award, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

const SITE_URL = PLATFORM_DEFAULTS.siteUrl;

// Slugs that have a dedicated /programs/{slug}/apply page.
// All others fall back to /apply?program={slug} (generic intake).
// Only slugs with a real /programs/{slug}/apply page.tsx go here.
// Everything else falls back to /apply?program={slug}.
const DEDICATED_APPLY_SLUGS = new Set([
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'hvac-technician',
  'peer-recovery-specialist',
]);

function getApplyHref(program: string): string {
  return DEDICATED_APPLY_SLUGS.has(program)
    ? `/programs/${program}/apply`
    : `/apply?program=${program}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ program: string }>;
}): Promise<Metadata> {
  const { program } = await params;
  const ogImage = getProgramOgImageUrl(program, SITE_URL);

  const ogBase = {
    images: [{ url: ogImage, width: 1200, height: 630, alt: `${program.replace(/-/g, ' ')} training program at ${PLATFORM_DEFAULTS.orgName}` }],
    siteName: PLATFORM_DEFAULTS.orgName,
    type: 'website' as const,
  };

  // Static ProgramSchema — preferred source for metadata
  const sp = getStaticProgram(program);
  if (sp) {
    const title = sp.metaTitle || `${sp.title} | ${PLATFORM_DEFAULTS.orgName}`;
    const description = sp.metaDescription || sp.subtitle || '';
    const img = sp.heroImage || ogImage;
    return {
      title,
      description,
      alternates: { canonical: `${SITE_URL}/programs/${program}` },
      openGraph: { ...ogBase, title, description, images: [{ url: img.startsWith('http') ? img : `${SITE_URL}${img}`, width: 1200, height: 630, alt: sp.title }] },
      twitter: { card: 'summary_large_image', title, description, images: [img.startsWith('http') ? img : `${SITE_URL}${img}`] },
    };
  }

  // cf-programs fallback
  const cfp = staticPrograms.find((p) => p.slug === program);
  if (cfp) {
    const title = `${cfp.title} | ${PLATFORM_DEFAULTS.orgName}`;
    const description = cfp.summary;
    return {
      title,
      description,
      alternates: { canonical: `${SITE_URL}/programs/${program}` },
      openGraph: { ...ogBase, title, description, images: [{ url: ogImage, width: 1200, height: 630, alt: cfp.title }] },
      twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    };
  }

  // DB fallback — programs with no static definition
  const db = createPublicClient();
  if (db) {
    const { data } = await db
      .from('programs')
      .select('title, description, short_description')
      .eq('slug', program)
      .maybeSingle();
    if (data) {
      const title = `${data.title} | ${PLATFORM_DEFAULTS.orgName}`;
      const description = data.short_description || data.description || '';
      return {
        title,
        description,
        alternates: { canonical: `${SITE_URL}/programs/${program}` },
        openGraph: { ...ogBase, title, description, images: [{ url: ogImage, width: 1200, height: 630, alt: data.title }] },
        twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
      };
    }
  }

  return {};
}

// Funding sources shown on every program page
const FUNDING_SOURCES = [
  {
    label: 'WIOA',
    tag: 'Federal',
    detail:
      'Workforce Innovation and Opportunity Act — covers eligible high-demand programs for adults, dislocated workers, and youth 16–24.',
  },
  {
    label: 'Workforce Ready Grant',
    tag: 'Indiana State',
    detail: 'Covers tuition for high-demand certification programs on the INDemand list.',
  },
  {
    label: 'FSSA IMPACT',
    tag: 'Indiana State',
    detail:
      'Pays for training at no cost to current SNAP or TANF recipients. Elevate is a participating provider.',
  },
  {
    label: 'Employer Sponsorship',
    tag: 'OJT / Apprenticeship',
    detail:
      'Employers can sponsor training through OJT wage reimbursement or registered apprenticeship agreements.',
  },
];

// How the program works — same for all programs
const HOW_IT_WORKS = [
  {
    n: '01',
    label: 'Apply and Complete Eligibility Review',
    detail:
      'Submit your application. We review funding eligibility and match you with available pathways.',
  },
  {
    n: '02',
    label: 'Enroll and Begin Training',
    detail:
      'Complete intake, sign your enrollment agreement, and start your program on the next available cohort date.',
  },
  {
    n: '03',
    label: 'Complete Coursework and Assessments',
    detail:
      'Work through structured lessons, hands-on labs, and checkpoint assessments tracked in real time.',
  },
  {
    n: '04',
    label: 'Earn Credentials',
    detail:
      'Pass your final assessment and receive your industry-recognized credential. Publicly verifiable.',
  },
  {
    n: '05',
    label: 'Connect with Employment Opportunities',
    detail:
      'Access job placement support, employer connections, and Indiana Career Connect listings.',
  },
];

function ProgramPage({
  title,
  summary,
  description,
  credential,
  durationWeeks,
  slug,
  sections,
  banner,
}: {
  title: string;
  summary: string;
  description: string;
  credential?: string | null;
  durationWeeks?: number | null;
  slug: string;
  sections?: Array<{ heading: string; body: string }>;
  banner?: import('@/content/heroBanners').HeroBannerConfig | null;
  imageUrl?: string | null;
}) {
  const heroPosterSrc = resolveHeroPosterSrc(slug, {
    banner,
    dbImageUrl: imageUrl,
    heroImage: getProgramOgImage(slug),
  });
  const learnItems = sections?.find(
    (s) => s.heading.toLowerCase().includes('learn') || s.heading.toLowerCase().includes('module'),
  );

  return (
    <main className="bg-white">
      {/* HERO — always show media; banner copy when present */}
      {banner?.pageKey ? (
        <HeroVideo
          videoSrcDesktop={banner.videoSrcDesktop ?? DEFAULT_HERO_VIDEO}
          videoSrcMobile={banner.videoSrcMobile}
          voiceoverSrc={banner.voiceoverSrc}
          microLabel={banner.microLabel}
          analyticsName={banner.analyticsName}
          belowHeroHeadline={banner.belowHeroHeadline}
          belowHeroSubheadline={banner.belowHeroSubheadline}
          ctas={[banner.primaryCta, ...(banner.secondaryCta ? [banner.secondaryCta] : [])]}
          trustIndicators={banner.trustIndicators}
          transcript={banner.transcript}
        />
      ) : (
        <HeroPicture
          src={heroPosterSrc}
          alt={banner?.microLabel ?? title}
          heightStyle={heroTokens.imageWrap}
          microLabel={banner?.microLabel}
          analyticsName={banner?.analyticsName ?? slug}
          belowHeroHeadline={banner?.belowHeroHeadline ?? title}
          belowHeroSubheadline={banner?.belowHeroSubheadline ?? (summary || description)}
          ctas={
            banner?.pageKey
              ? [banner.primaryCta, ...(banner.secondaryCta ? [banner.secondaryCta] : [])]
              : [
                  { label: 'Apply Now', href: getApplyHref(slug), variant: 'primary' as const },
                  { label: 'Check Eligibility', href: '/check-eligibility', variant: 'secondary' as const },
                ]
          }
          trustIndicators={banner?.trustIndicators}
          transcript={banner?.transcript}
        />
      )}

      {/* SECTION 1: OUTCOME FIRST */}
      <section className="bg-slate-950 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-4">
            Program
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-5">
            {title}
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mb-8">
            {summary || description}
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            {credential && (
              <span className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-full">
                <Award aria-label="award" className="w-3.5 h-3.5 text-brand-red-400" /> {credential}
              </span>
            )}
            {durationWeeks && (
              <span className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-full">
                <Clock className="w-3.5 h-3.5 text-brand-red-400" /> {durationWeeks} weeks
              </span>
            )}
            <span className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-full">
              <DollarSign className="w-3.5 h-3.5 text-brand-red-400" /> Funding may be available
            </span>
            <span className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-brand-red-400" /> Employer-aligned training
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={getApplyHref(slug)}
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-extrabold px-10 py-4 rounded-xl transition-colors text-sm text-center"
            >
              Apply Now
            </Link>
            <Link
              href="/check-eligibility"
              className="border-2 border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white font-extrabold px-10 py-4 rounded-xl transition-colors text-sm text-center"
            >
              Check Eligibility
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: FUNDING */}
      <section className="bg-brand-red-700 py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-3">
            Funding May Be Available
          </h2>
          <p className="text-red-100 text-sm mb-8 max-w-2xl">
            This program may qualify for state and federal funding depending on eligibility. Most
            students pay $0.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {FUNDING_SOURCES.map((f) => (
              <div key={f.label} className="bg-white rounded-xl p-5">
                <p className="text-brand-red-600 text-[10px] font-extrabold uppercase tracking-widest mb-1">
                  {f.tag}
                </p>
                <h3 className="text-slate-900 font-extrabold text-sm mb-2">{f.label}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{f.detail}</p>
              </div>
            ))}
          </div>
          <Link
            href="/check-eligibility"
            className="inline-block bg-white text-brand-red-700 font-extrabold px-8 py-3.5 rounded-xl hover:bg-red-50 transition-colors text-sm"
          >
            Check My Eligibility
          </Link>
        </div>
      </section>

      {/* SECTION 3: WHAT YOU WILL LEARN */}
      {learnItems && (
        <section className="bg-white py-16 px-6 border-t border-slate-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-8">{learnItems.heading}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{learnItems.body}</p>
          </div>
        </section>
      )}

      {/* SECTION 3b: OTHER SECTIONS from static content */}
      {sections &&
        sections.filter((s) => !s.heading.toLowerCase().includes('learn')).length > 0 && (
          <section className="bg-slate-50 py-16 px-6 border-t border-slate-100">
            <div className="max-w-4xl mx-auto space-y-8">
              {sections
                .filter((s) => !s.heading.toLowerCase().includes('learn'))
                .map((section) => (
                  <div key={section.heading}>
                    <h2 className="text-lg font-extrabold text-slate-900 mb-3">
                      {section.heading}
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed">{section.body}</p>
                  </div>
                ))}
            </div>
          </section>
        )}

      {/* SECTION 4: CREDENTIALS */}
      {credential && (
        <section className="bg-slate-950 py-14 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-8">
              Credentials You Can Earn
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-start gap-4 bg-slate-900 border border-slate-700 rounded-xl px-6 py-5">
                <Award aria-label="award" className="w-5 h-5 text-brand-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-extrabold text-sm">{credential}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Industry-recognized. Proctored on-site.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-slate-900 border border-slate-700 rounded-xl px-6 py-5">
                <CheckCircle className="w-5 h-5 text-brand-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-extrabold text-sm">
                    Elevate Completion Certificate
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Publicly verifiable. Issued on completion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5: HOW IT WORKS */}
      <section className="bg-white py-16 px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-10">How This Program Works</h2>
          <div className="space-y-3">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.n}
                className="flex items-start gap-5 border border-slate-200 rounded-xl px-6 py-5"
              >
                <span className="text-brand-red-600 font-black text-xs tracking-widest shrink-0 mt-0.5">
                  {step.n}
                </span>
                <div>
                  <p className="text-slate-900 font-extrabold text-sm mb-1">{step.label}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: PROGRAM DETAILS */}
      <section className="bg-slate-50 py-14 px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-extrabold text-slate-900 mb-8">Program Details</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                label: 'Duration',
                value: durationWeeks ? `${durationWeeks} weeks` : 'See enrollment',
              },
              { label: 'Format', value: 'Online + Hands-On' },
              { label: 'Schedule', value: 'Flexible / Cohort-based' },
              { label: 'Prerequisites', value: 'None required' },
              { label: 'Delivery', value: 'Instructor-led with self-paced components' },
              { label: 'Location', value: 'Indianapolis, Indiana' },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white border border-slate-200 rounded-xl px-5 py-4"
              >
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                  {item.label}
                </p>
                <p className="text-slate-900 font-extrabold text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: COMPLIANCE ALIGNMENT */}
      <section className="bg-slate-950 py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <ShieldCheck className="w-7 h-7 text-brand-red-400 mb-5" />
          <h2 className="text-xl font-extrabold text-white mb-6">
            Aligned with Workforce Standards
          </h2>
          <div className="space-y-3">
            {[
              'WIOA-Aligned Training Structure',
              'Delivered by an ETPL-Approved Training Provider',
              'Supports Employment and Credential Outcomes',
              'DOL Registered Apprenticeship Sponsor',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle className="w-4 h-4 text-brand-red-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: CAREER OUTCOMES */}
      <section className="bg-white py-14 px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-extrabold text-slate-900 mb-3">Career Pathways</h2>
          <p className="text-slate-500 text-sm mb-8">
            Entry-level roles with growth potential in high-demand fields.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              `${title} (Entry Level)`,
              'Maintenance Technician',
              'Facilities Technician',
              'Apprentice — Registered DOL Pathway',
            ].map((role) => (
              <span
                key={role}
                className="border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 font-semibold text-sm"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: FINAL CTA */}
      <section className="bg-brand-red-700 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-5">
            Start Your Path Today
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={getApplyHref(slug)}
              className="bg-white text-brand-red-700 font-extrabold px-10 py-4 rounded-xl hover:bg-red-50 transition-colors text-sm"
            >
              Apply Now
            </Link>
            <Link
              href="/check-eligibility"
              className="border-2 border-white text-slate-900 font-extrabold px-10 py-4 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Check Eligibility
            </Link>
          </div>
          <p className="mt-8 text-red-100 text-xs">
            Questions? Call or text{' '}
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="text-white font-bold underline">
              {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ program: string }> }) {
  const { program } = await params;

  // Static ProgramSchema — richest renderer, always preferred when available.
  // Overlay DB title/description if the program also exists in the DB.
  const sp = getStaticProgram(program);
  if (sp) {
    const db = createPublicClient();
    let mergedProgram = sp;
    if (db) {
      const { data: dbRow } = await db
        .from('programs')
        .select('title, description, short_description, credential, duration_weeks')
        .eq('slug', program)
        .maybeSingle();
      if (dbRow) {
        mergedProgram = {
          ...sp,
          title: dbRow.title || sp.title,
          subtitle: dbRow.short_description || dbRow.description || sp.subtitle,
        };
      }
    }
    const banner = heroBanners[mergedProgram.slug] ?? null;
    return (
      <>
        <ProgramStructuredData
          program={{
            id: mergedProgram.slug,
            name: mergedProgram.title,
            slug: mergedProgram.slug,
            description: mergedProgram.subtitle,
            duration_weeks: mergedProgram.durationWeeks,
            price: parseInt(mergedProgram.selfPayCost.replace(/[^0-9]/g, ''), 10),
            image_url: mergedProgram.heroImage,
            category: mergedProgram.category,
            outcomes: mergedProgram.outcomes.map((o) => o.statement),
          }}
        />
        <ProgramDetailPageComponent program={mergedProgram} banner={banner} />
        {LIVE_JOBS_PROGRAM_SLUGS.has(program) ? (
          <LiveJobPostings
            programSlug={program}
            heading={`Hiring for ${mergedProgram.title} graduates`}
            limit={6}
            className="bg-slate-50 border-t border-slate-100"
          />
        ) : null}
        <OnetLaborData slug={program} />
      </>
    );
  }

  // cf-programs fallback (legacy marketing data)
  const cfProgram = staticPrograms.find((p) => p.slug === program);
  if (cfProgram) {
    return (
      <>
        <ProgramPage
          title={cfProgram.title}
          summary={cfProgram.summary}
          description={cfProgram.description}
          slug={cfProgram.slug}
          sections={cfProgram.sections}
          banner={heroBanners[cfProgram.slug] ?? null}
          imageUrl={getProgramOgImage(cfProgram.slug)}
        />
        <OnetLaborData slug={cfProgram.slug} />
      </>
    );
  }

  // DB fallback — programs that exist only in the database with no static definition
  const db = createPublicClient();
  if (db) {
    const { data: p } = await db
      .from('programs')
      .select('slug, title, description, short_description, credential, duration_weeks, image_url')
      .eq('slug', program)
      .maybeSingle();

    if (p) {
      return (
        <>
          <ProgramPage
            title={p.title}
            summary={p.short_description || ''}
            description={p.description || ''}
            credential={p.credential}
            durationWeeks={p.duration_weeks}
            slug={p.slug}
            banner={heroBanners[p.slug] ?? heroBanners[p.slug.replace(/-apprenticeship$/, '')] ?? null}
            imageUrl={p.image_url}
            sections={
              p.description && p.description !== p.short_description
                ? [{ heading: 'About This Program', body: p.description }]
                : undefined
            }
          />
          <OnetLaborData slug={p.slug} />
        </>
      );
    }
  }

  return notFound();
}
