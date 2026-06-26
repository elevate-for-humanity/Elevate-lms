import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { loadProgramForPage, loadProgramMetadataSource } from '@/lib/programs/load-program-page';
import { getProgramOgImageUrl } from '@/lib/programs/og-images';
import heroBanners from '@/content/heroBanners';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramDetailPageComponent from '@/components/programs/ProgramDetailPage';
import CdlEnrollmentOpenBanner from '@/components/programs/CdlEnrollmentOpenBanner';
import { OnetLaborData } from '@/components/programs/onet/OnetLaborData';

// On-demand rendering only - prevents memory spikes on 1,000+ variants
export const dynamic = 'force-dynamic';

const SITE_URL = PLATFORM_DEFAULTS.siteUrl;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ program: string }>;
}): Promise<Metadata> {
  const { program } = await params;
  const meta = await loadProgramMetadataSource(program);
  if (!meta) return {};

  const ogImage = getProgramOgImageUrl(program, SITE_URL);
  const img =
    meta.image?.startsWith('http') ? meta.image
    : meta.image ? `${SITE_URL}${meta.image}`
    : ogImage;

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `${SITE_URL}/programs/${program}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      siteName: PLATFORM_DEFAULTS.orgName,
      type: 'website',
      images: [{ url: img, width: 1200, height: 630, alt: meta.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [img],
    },
  };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ program: string }> }) {
  const { program } = await params;
  const loaded = await loadProgramForPage(program);

  if (!loaded) {
    return notFound();
  }

  const { program: mergedProgram } = loaded;
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
          price: parseInt(mergedProgram.selfPayCost.replace(/[^0-9]/g, ''), 10) || undefined,
          image_url: mergedProgram.heroImage,
          category: mergedProgram.category,
          outcomes: mergedProgram.outcomes.map((o) => o.statement),
        }}
      />
      <ProgramDetailPageComponent
        program={mergedProgram}
        banner={banner}
        announcement={
          mergedProgram.slug === 'cdl-training' ? <CdlEnrollmentOpenBanner /> : undefined
        }
      />
      <OnetLaborData slug={mergedProgram.slug} />
    </>
  );
}
