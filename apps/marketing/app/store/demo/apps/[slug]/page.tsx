import { notFound } from 'next/navigation';
import { getIndividualAppCatalog } from '@/lib/apps/individual-app-plans';
import IndividualAppDemo from '@/components/store/IndividualAppDemo';
import { searchOpportunities } from '@/lib/integrations/grants-gov';
import { grantRecord } from '@/lib/apps/workspaces/grants';
export const revalidate = 600;
export const metadata = { title: 'Try an app and compare subscription plans | Elevate Store' };
export default async function IndividualDemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const { slug } = await params;
  const catalog = getIndividualAppCatalog(slug);
  if (!catalog) notFound();
  let opportunities: any[] = [];
  if (slug === 'grants') {
    try {
      const results = await searchOpportunities({
        keyword: 'workforce',
        rows: 5,
        oppStatuses: ['posted', 'forecasted'],
      });
      opportunities = results.opportunities.map((row) => ({ ...grantRecord(row), id: row.id }));
    } catch {
      /* The public demo shows an explicit unavailable state; it never invents grant awards. */
    }
  }
  const { plan } = await searchParams;
  return <IndividualAppDemo catalog={catalog} opportunities={opportunities} initialPlan={plan} />;
}
