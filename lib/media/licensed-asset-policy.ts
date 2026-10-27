/**
 * Canonical policy for using third-party licensed creative assets across Elevate.
 *
 * Customers receive rendered/customized deliverables. They never receive a
 * browsable mirror of a provider catalog or unrestricted raw source files.
 */
export type LicensedAssetConsumer =
  | 'course_builder'
  | 'website_builder'
  | 'store_builder'
  | 'subscription_delivery'
  | 'marketing_page'
  | 'program_page'
  | 'apprenticeship_page'
  | 'admin_dashboard'
  | 'program_holder_dashboard'
  | 'host_shop_dashboard'
  | 'apprentice_dashboard'
  | 'learner_dashboard'
  | 'instructor_dashboard';

export type LicensedAssetCategory =
  | 'stock_video'
  | 'photo'
  | 'graphic'
  | 'presentation_template'
  | 'video_template'
  | 'music'
  | 'sound_effect'
  | 'lut'
  | 'font';

export type LicensedAssetPlan = 'starter' | 'professional' | 'enterprise';

export interface LicensedAssetProjectPolicy {
  provider: 'envato';
  consumer: LicensedAssetConsumer;
  plan: LicensedAssetPlan;
  categories: LicensedAssetCategory[];
  maxAssetsPerProject: number | null;
  licenseEvidenceRequired: true;
  rawFileRedistributionAllowed: false;
  providerCatalogExposureAllowed: false;
  deliveryMode: 'finished_output_only';
  status: 'enabled';
}

const CATEGORIES: Record<LicensedAssetPlan, LicensedAssetCategory[]> = {
  starter: ['photo', 'graphic', 'font'],
  professional: [
    'stock_video',
    'photo',
    'graphic',
    'presentation_template',
    'video_template',
    'music',
    'sound_effect',
    'lut',
    'font',
  ],
  enterprise: [
    'stock_video',
    'photo',
    'graphic',
    'presentation_template',
    'video_template',
    'music',
    'sound_effect',
    'lut',
    'font',
  ],
};

export function normalizeLicensedAssetPlan(plan: string | null | undefined): LicensedAssetPlan {
  if (plan === 'enterprise' || plan === 'professional') return plan;
  return 'starter';
}

export function buildLicensedAssetProjectPolicy(input: {
  consumer: LicensedAssetConsumer;
  plan: string | null | undefined;
}): LicensedAssetProjectPolicy {
  const plan = normalizeLicensedAssetPlan(input.plan);
  return {
    provider: 'envato',
    consumer: input.consumer,
    plan,
    categories: [...CATEGORIES[plan]],
    maxAssetsPerProject: plan === 'starter' ? 10 : plan === 'professional' ? 40 : null,
    licenseEvidenceRequired: true,
    rawFileRedistributionAllowed: false,
    providerCatalogExposureAllowed: false,
    deliveryMode: 'finished_output_only',
    status: 'enabled',
  };
}
