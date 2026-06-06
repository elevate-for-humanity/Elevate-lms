/**
 * Sector groupings for marketing surfaces (/education, /career-training) —
 * derived from the same SSR catalog as /programs and enrollment.
 */

import { PROGRAM_SECTION_META } from '@/lib/programs/category-normalize';
import {
  getPublicProgramsPageData,
  resolvePublicProgramCount,
  type ProgramsPageRow,
} from '@/lib/programs/public-programs-page';

export type ProgramSectorCard = {
  sectionKey: string;
  title: string;
  href: string;
  image: string;
  description: string;
  tags: string[];
  programCount: number;
};

const SECTOR_PRESENTATION: Record<
  string,
  { title: string; href: string; image: string; description: string }
> = {
  healthcare: {
    title: 'Healthcare',
    href: '/programs/healthcare',
    image: '/images/pages/cna-patient-care.jpg',
    description:
      'CNA, Medical Assistant, Phlebotomy, and more. Hands-on clinical training for in-demand healthcare careers.',
  },
  trades: {
    title: 'Skilled Trades',
    href: '/programs/skilled-trades',
    image: '/images/pages/hvac-technician.webp',
    description:
      'HVAC, Electrical, Welding, Plumbing, and Construction. Earn industry certifications and start working.',
  },
  technology: {
    title: 'Technology',
    href: '/programs/technology',
    image: '/images/pages/cybersecurity.webp',
    description:
      'Cybersecurity, IT Support, Software Development, and Networking. Launch a career in tech.',
  },
  beauty: {
    title: 'Beauty & Cosmetology',
    href: '/programs/barber-apprenticeship',
    image: '/images/pages/barber-apprenticeship.webp',
    description:
      'Barber apprenticeships and cosmetology training. Learn from licensed professionals in real shop settings.',
  },
  business: {
    title: 'Business & Finance',
    href: '/programs/business-administration',
    image: '/images/business/office-admin.webp',
    description:
      'Bookkeeping, Office Administration, and Entrepreneurship programs.',
  },
  apprenticeship: {
    title: 'Apprenticeships',
    href: '/programs',
    image: '/images/pages/skilled-trades-sector.webp',
    description: 'DOL-registered earn-while-you-learn pathways across licensed trades.',
  },
};

function groupBySection(programs: ProgramsPageRow[]): Map<string, ProgramsPageRow[]> {
  const map = new Map<string, ProgramsPageRow[]>();
  for (const p of programs) {
    const key = p.category || 'other';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return map;
}

export async function getMarketingProgramSectors(): Promise<{
  sectors: ProgramSectorCard[];
  totalProgramCount: number;
  catalogSource: 'database' | 'static-fallback';
}> {
  const { programs, programCount, catalogSource } = await getPublicProgramsPageData();
  const totalProgramCount = resolvePublicProgramCount(programCount);
  const grouped = groupBySection(programs);

  const order = Object.entries(PROGRAM_SECTION_META)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key]) => key);

  const sectors: ProgramSectorCard[] = [];

  for (const sectionKey of order) {
    const rows = grouped.get(sectionKey);
    if (!rows?.length) continue;
    const preset = SECTOR_PRESENTATION[sectionKey];
    const label = PROGRAM_SECTION_META[sectionKey]?.label ?? sectionKey;
    sectors.push({
      sectionKey,
      title: preset?.title ?? label,
      href: preset?.href ?? '/programs',
      image: preset?.image ?? '/images/programs-hero-vibrant.webp',
      description: preset?.description ?? `Explore ${label} programs.`,
      tags: rows.slice(0, 4).map((r) => r.title),
      programCount: rows.length,
    });
  }

  // CDL card when any transportation-related slug present
  const cdlRows = programs.filter((p) =>
    /cdl|diesel|truck/i.test(`${p.slug} ${p.title}`),
  );
  if (cdlRows.length > 0 && !sectors.some((s) => s.sectionKey === 'trades')) {
    sectors.push({
      sectionKey: 'cdl',
      title: 'CDL & Transportation',
      href: '/programs/cdl-training',
      image: '/images/pages/cdl-truck-highway.webp',
      description:
        'Commercial Driving License training with job placement. Class A and Class B CDL programs.',
      tags: cdlRows.slice(0, 3).map((r) => r.title),
      programCount: cdlRows.length,
    });
  }

  return { sectors, totalProgramCount, catalogSource };
}
