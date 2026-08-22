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
const checkout = 'apps/marketing/app/api/store/platform-checkout/route.ts';
const plansClient = 'apps/marketing/app/store/plans/PlansPageClient.tsx';
const marketplace = 'components/store/AddOnMarketplaceSection.tsx';
const addonIndex = 'apps/marketing/app/store/add-ons/page.tsx';
const licenses = 'apps/marketing/app/store/licenses/page.tsx';
const courseCatalogMigration = 'supabase/migrations/20260822101500_add_unified_course_platform_addon.sql';

for (const path of [pricing, featureCatalog, checkout, plansClient, marketplace, addonIndex, licenses, courseCatalogMigration]) read(path);

// One unified course commercial product; legacy component products remain
// resolvable only for existing subscriptions.
requireText(pricing, "slug: 'course-creation-learning-platform'", 'Unified Course Creation & Learning Platform must remain in the canonical pricing catalog');
requireText(pricing, "slug: 'online-courses-lms'", 'Legacy LMS compatibility SKU must remain resolvable');
requireText(pricing, "slug: 'course-builder'", 'Legacy Course Builder compatibility SKU must remain resolvable');
requireText(pricing, "slug: 'ai-course-factory'", 'Legacy Course Factory compatibility SKU must remain resolvable');
requireText(pricing, 'hiddenFromMarketplace: true', 'Legacy compatibility products must be hidden from public marketplace sale');
requireText(featureCatalog, "'course-creation-learning-platform': 'course-creation-learning-platform'", 'Unified course SKU must map to its canonical entitlement code');
requireText(courseCatalogMigration, "'course-creation-learning-platform'", 'Unified course SKU must exist in the database catalog migration');

// Public checkout and plan selection must not bypass hidden-product governance.
requireText(checkout, 'addon?.hiddenFromMarketplace', 'Checkout must reject hidden legacy add-ons');
requireText(plansClient, '!addon.hiddenFromMarketplace', 'Plan query-string preselection must ignore hidden legacy add-ons');
requireText(marketplace, '!addon.hiddenFromMarketplace', 'Public subscription marketplace must filter hidden legacy add-ons');

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
console.log('Store surfaces, hidden compatibility SKUs, entitlement mapping and managed licensing are aligned');
