import { notFound } from 'next/navigation';
import { BASE_PLANS, type BasePlanId } from '@/lib/store/platform-pricing';
import { CAPABILITY_CATALOG } from '@/lib/platform/capability-catalog';
import PlanDemoWorkspace from '@/components/store/PlanDemoWorkspace';

export default async function PlanDemoPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan: id } = await params;
  if (!Object.hasOwn(BASE_PLANS, id)) notFound();
  const plan = BASE_PLANS[id as BasePlanId];
  const capabilities = CAPABILITY_CATALOG.filter(
    (item) => plan.features.includes(item.key) && item.status !== 'internal',
  );
  return (
    <PlanDemoWorkspace
      name={`${plan.name} plan`}
      description={plan.featureBullets.join(' · ')}
      capabilities={capabilities}
    />
  );
}
