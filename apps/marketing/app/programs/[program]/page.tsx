import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import heroBanners from '@/content/heroBanners';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { loadProgramForPage, loadProgramMetadataSource } from '@/lib/programs/load-program-page';
import { getProgramOgImageUrl } from '@/lib/programs/og-images';

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
      <ProgramDetailPage program={resolved} banner={heroBanners[resolved.slug] ?? null} />
    </>
  );
}
