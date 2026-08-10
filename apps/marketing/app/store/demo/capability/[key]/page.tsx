import { notFound } from 'next/navigation';
import CapabilitySubscriptionDemo from '@/components/store/CapabilitySubscriptionDemo';
import { CAPABILITY_CATALOG } from '@/lib/platform/capability-catalog';
import { ADD_ON_MARKETPLACE, BASE_PLANS } from '@/lib/store/platform-pricing';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

export const dynamic = 'force-static';

const CATEGORY_LABELS: Record<string, string> = {
  business: 'Business Growth',
  ai: 'AI Team',
  education: 'Education',
  workforce: 'Workforce',
  compliance: 'Compliance',
  apps: 'Business Apps',
  enterprise: 'Enterprise',
};

function individualCatalogForKey(key: string) {
  if (key === 'website_builder') return INDIVIDUAL_APP_CATALOG['website-builder'];
  if (key === 'sam_gov_manager') return INDIVIDUAL_APP_CATALOG['sam-gov'];
  if (key === 'grants_discovery') return INDIVIDUAL_APP_CATALOG.grants;
  return null;
}

function subscriptionSnapshot(key: string) {
  const individual = individualCatalogForKey(key);
  if (individual) {
    return {
      priceLabel: `Plans from ${individual.plans[0]?.priceLabel ?? 'monthly'}`,
      details: individual.plans.map((plan) => `${plan.name}: ${plan.priceLabel} — ${plan.features.slice(0, 3).join(', ')}`),
      actionHref: `/store/apps/${individual.slug}`,
    };
  }

  const addon = ADD_ON_MARKETPLACE.find((item) => item.features.includes(key as never));
  if (addon) {
    return {
      priceLabel: `$${addon.priceMonthly}/month add-on`,
      details: [
        `Monthly add-on: $${addon.priceMonthly}`,
        'Activates inside the connected Elevate account',
        'Can be combined with other business and AI capabilities',
      ],
      actionHref: '/store/plans',
    };
  }

  const basePlan = Object.values(BASE_PLANS).find((plan) => plan.features.includes(key as never));
  if (basePlan) {
    return {
      priceLabel: `Included from $${basePlan.priceMonthly}/month`,
      details: [
        `Included beginning with the ${basePlan.name} plan`,
        `Base plan: $${basePlan.priceMonthly}/month`,
        'Additional usage or specialist add-ons may be billed separately when applicable',
      ],
      actionHref: '/store/plans',
    };
  }

  return {
    priceLabel: 'Available by plan or configuration',
    details: [
      'Preview the capability before activation',
      'Final price depends on the selected Elevate plan or add-on',
      'Usage-based AI, messaging, voice, image, or video capacity may use credits',
    ],
    actionHref: '/store/plans',
  };
}

export function generateStaticParams() {
  return CAPABILITY_CATALOG.filter((capability) => capability.status !== 'internal').map((capability) => ({
    key: String(capability.key),
  }));
}

export default async function CapabilityDemoPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const capability = CAPABILITY_CATALOG.find(
    (candidate) => String(candidate.key) === key && candidate.status !== 'internal',
  );

  if (!capability) notFound();

  const subscription = subscriptionSnapshot(String(capability.key));
  const actionHref = capability.storeHref || capability.marketingHref || capability.appHref || subscription.actionHref;

  return (
    <main className="min-h-screen bg-white font-medium text-slate-950">
      <CapabilitySubscriptionDemo
        name={capability.name}
        description={capability.description}
        categoryLabel={CATEGORY_LABELS[capability.category] || 'Elevate'}
        priceLabel={subscription.priceLabel}
        subscriptionDetails={subscription.details}
        actionHref={actionHref}
        trialText="The 14-day trial gives limited access so customers can experience the workflow before paying. AI-heavy actions consume trial credits; paid capacity continues through the selected plan, add-on, or credit pack."
      />
    </main>
  );
}
