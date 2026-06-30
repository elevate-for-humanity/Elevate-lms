import type { Metadata } from 'next';
import { buildSiteMetadata } from '@/lib/seo/build-site-metadata';
import { getMarketingProgramSectors } from '@/lib/programs/catalog-sectors';

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { totalProgramCount } = await getMarketingProgramSectors();
  return buildSiteMetadata({
    title: 'Career Training Programs — Education',
    description: `${totalProgramCount} credential-bearing career training programs in healthcare, skilled trades, technology, CDL, barbering, and business. WIOA and state workforce funding available.`,
    path: '/education',
  });
}

export default function EducationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
