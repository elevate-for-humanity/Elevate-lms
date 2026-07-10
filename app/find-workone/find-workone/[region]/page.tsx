import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { WorkOneIndianaMap } from '@/components/workone/WorkOneIndianaMap';
import { getWorkOneRegion, WORKONE_REGIONS } from '@/data/workone/indiana-regions';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { CredentialAuthorityFootnote } from '@/components/compliance/CredentialAuthorityFootnote';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return WORKONE_REGIONS.map((r) => ({ region: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region: slug } = await params;
  const region = getWorkOneRegion(slug);
  if (!region) return { title: 'WorkOne Region' };

  return {
    title: `${region.name} WorkOne Centers | Indiana Workforce Funding`,
    description: `WorkOne career centers in ${region.name}. WIOA and Workforce Ready Grant intake for ${PLATFORM_DEFAULTS.orgName} ETPL-approved training.`,
    alternates: { canonical: `https://www.elevateforhumanity.org/find-workone/${slug}` },
  };
}

export default async function WorkOneRegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: slug } = await params;
  const region = getWorkOneRegion(slug);
  if (!region) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Find WorkOne', href: '/find-workone' },
              { label: region.name },
            ]}
          />
        </div>
      </div>

      <section className="py-10 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
            WorkOne — {region.name}
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">{region.description}</p>
          <p className="text-xs text-slate-500 mt-4">
            Counties: {region.counties.join(', ')}
          </p>
          <Link
            href="/workforce-training-indianapolis"
            className="inline-block mt-4 text-sm font-semibold text-brand-blue-700 hover:underline"
          >
            {PLATFORM_DEFAULTS.orgName} training programs in this region →
          </Link>
        </div>
      </section>

      <WorkOneIndianaMap region={region} />

      <CredentialAuthorityFootnote />
    </div>
  );
}
