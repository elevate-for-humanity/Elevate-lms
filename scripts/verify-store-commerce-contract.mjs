import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function read(path) {
  const full = join(root, path);
  if (!existsSync(full)) {
    failures.push(`missing Store contract file: ${path}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

function requireText(path, text, message) {
  const content = read(path);
  if (content && !content.includes(text)) failures.push(message);
}

function forbidText(path, text, message) {
  const content = read(path);
  if (content.includes(text)) failures.push(message);
}

const pricing = 'lib/store/platform-pricing.ts';
const featureCatalog = 'lib/platform/feature-catalog.ts';
const organizationFeatures = 'lib/platform/organization-features.ts';
const checkout = 'apps/marketing/app/api/store/platform-checkout/route.ts';
const plansClient = 'apps/marketing/app/store/plans/PlansPageClient.tsx';
const marketplace = 'components/store/AddOnMarketplaceSection.tsx';
const addonIndex = 'apps/marketing/app/store/add-ons/page.tsx';
const licenses = 'apps/marketing/app/store/licenses/page.tsx';
const courseCatalogMigration = 'supabase/migrations/20260822101500_add_unified_course_platform_addon.sql';
const whiteLabelRetirement = 'supabase/migrations/20260822105500_retire_unprovisioned_white_label_mobile.sql';

for (const path of [pricing, featureCatalog, organizationFeatures, checkout, plansClient, marketplace, addonIndex, licenses, courseCatalogMigration, whiteLabelRetirement]) read(path);

// One unified course commercial product; legacy component products remain
// resolvable only for existing subscriptions.
requireText(pricing, "slug: 'course-creation-learning-platform'", 'Unified Course Creation & Learning Platform must remain in the canonical pricing catalog');
requireText(pricing, "slug: 'online-courses-lms'", 'Legacy LMS compatibility SKU must remain resolvable');
requireText(pricing, "slug: 'course-builder'", 'Legacy Course Builder compatibility SKU must remain resolvable');
requireText(pricing, "slug: 'ai-course-factory'", 'Legacy Course Factory compatibility SKU must remain resolvable');
requireText(pricing, 'hiddenFromMarketplace: true', 'Legacy/managed compatibility products must be hidden from public marketplace sale');
requireText(featureCatalog, "'course-creation-learning-platform': 'course-creation-learning-platform'", 'Unified course SKU must map to its canonical entitlement code');
requireText(courseCatalogMigration, "'course-creation-learning-platform'", 'Unified course SKU must exist in the database catalog migration');

// Public checkout and plan selection must not bypass hidden-product governance
// or sell a feature that the selected base plan already includes.
requireText(checkout, 'addon?.hiddenFromMarketplace', 'Checkout must reject hidden legacy or managed add-ons');
requireText(checkout, 'const redundantAddons = addons.filter(', 'Checkout must detect add-ons already included in the selected base plan');
requireText(checkout, 'addon.features.every((feature) => plan.features.includes(feature))', 'Checkout redundancy detection must compare canonical feature sets');
requireText(plansClient, '!addon.hiddenFromMarketplace', 'Plan query-string preselection must ignore hidden legacy add-ons');
requireText(marketplace, '!addon.hiddenFromMarketplace', 'Public subscription marketplace must filter hidden legacy add-ons');

// Capacity products must change runtime entitlements, not merely create billing rows.
requireText(organizationFeatures, "active.has('additional-user')", 'Additional User must raise the runtime user limit');
requireText(organizationFeatures, "active.has('additional-location')", 'Additional Location must raise the runtime location limit');
requireText(organizationFeatures, "active.has('additional-storage')", 'Additional Storage must raise the runtime storage limit');
requireText(organizationFeatures, 'limits.storageGb', 'Storage capacity must be represented in canonical plan limits');
requireText(pricing, 'Adds 1 licensed seat', 'Additional User claim must match one-unit fulfillment');
requireText(pricing, 'Adds 1 business location', 'Additional Location claim must match one-unit fulfillment');
requireText(pricing, 'Adds 100 GB', 'Additional Storage claim must match one-unit fulfillment');

// Do not advertise usage allowances or automatic overage billing until a meter
// and billing lifecycle exist in the repository.
forbidText(pricing, '500 SMS included', 'Store must not promise an unimplemented 500-SMS allowance');
forbidText(pricing, 'Additional usage billed separately', 'Store must not promise unimplemented SMS overage billing');

// White-label mobile/PWA is managed until customer-specific provisioning exists.
requireText(pricing, "slug: 'white-label-mobile'", 'White Label Mobile compatibility SKU must remain resolvable');
requireText(pricing, "Branding and mobile/PWA scope confirmed before sale", 'White Label Mobile must be described as managed scope');
requireText(whiteLabelRetirement, "code = 'white-label-mobile'", 'Live catalog must retire White Label Mobile from self-service fulfillment');

// No second hard-coded lifetime add-on catalog is allowed on the public Store.
forbidText(marketplace, 'ONE_TIME_ADDONS', 'Public Store must not restore a second hard-coded one-time add-on catalog');
forbidText(marketplace, 'Lifetime access', 'Public Store must not advertise unsupported lifetime add-on access');
requireText(addonIndex, "import { ADD_ON_MARKETPLACE } from '@/lib/store/platform-pricing'", 'Add-ons index must use canonical platform pricing');
forbidText(addonIndex, 'COMMUNITY_ADDONS', 'Add-ons index must not use the legacy community price catalog');

// Enterprise/source-use licensing is managed until a complete contract,
// provisioning and self-service payment lifecycle exists.
forbidText(licenses, '/store/licenses/checkout/', 'Managed platform licenses must not link to the incomplete legacy checkout route');
requireText(licenses, 'Managed / Contract', 'Platform licenses must clearly identify managed contract status');
requireText(licenses, 'Request License Scope', 'Platform licenses must route buyers to scoped sales review');

if (failures.length) {
  console.error('[store-commerce-contract] FAILED');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[store-commerce-contract] PASS');
console.log('Store surfaces, catalog claims, entitlement mapping, capacity fulfillment and managed licensing are aligned');
