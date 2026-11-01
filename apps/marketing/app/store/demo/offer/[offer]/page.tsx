import { notFound } from 'next/navigation';
import { COMMERCE_CATALOG } from '@/lib/store/commerce-catalog';
import { CAPABILITY_CATALOG } from '@/lib/platform/capability-catalog';
import PlanDemoWorkspace from '@/components/store/PlanDemoWorkspace';
export default async function OfferDemoPage({ params }: { params: Promise<{ offer: string }> }) {
  const { offer } = await params;
  const item = COMMERCE_CATALOG.find((row) => row.id === offer);
  if (!item) notFound();
  const capabilities = CAPABILITY_CATALOG.filter(
    (row) => item.proofFeatureKeys.includes(row.key) && row.status !== 'internal',
  );
  return (
    <PlanDemoWorkspace
      name={item.name}
      description={item.description}
      capabilities={capabilities}
    />
  );
}
