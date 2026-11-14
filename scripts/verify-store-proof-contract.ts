import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';
import { CAPABILITY_CATALOG } from '@/lib/platform/capability-catalog';
import type { PlatformFeatureKey } from '@/lib/platform/features';
import { COMMERCE_CATALOG } from '@/lib/store/commerce-catalog';
import {
  STORE_FEATURE_PROOFS,
  STORE_PRODUCT_PROOFS,
  type StoreFeatureProof,
  type StoreProductProof,
} from '@/lib/store/offer-proof';
import { ADD_ON_MARKETPLACE, BASE_PLANS } from '@/lib/store/platform-pricing';

const root = process.cwd();
const failures: string[] = [];
const checkedSources = new Set<string>();
const checkedFeatures = new Set<PlatformFeatureKey>();
const allowedEvidenceHosts = new Set([
  'www.elevateforhumanity.org',
  'store.elevateforhumanity.org',
  'app.elevateforhumanity.org',
  'admin.elevateforhumanity.org',
]);

function fail(message: string) {
  failures.push(message);
}

function routeExists(href: string): boolean {
  const pathname = href.split('#')[0]?.split('?')[0] || '/';
  const segments = pathname.split('/').filter(Boolean);

  function walk(directory: string, index: number): boolean {
    if (index === segments.length) return existsSync(join(directory, 'page.tsx'));
    if (!existsSync(directory) || !statSync(directory).isDirectory()) return false;

    const exact = join(directory, segments[index]);
    if (existsSync(exact) && statSync(exact).isDirectory() && walk(exact, index + 1)) return true;

    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('['))
      .some((entry) => walk(join(directory, entry.name), index + 1));
  }

  return walk(join(root, 'apps/marketing/app'), 0);
}

function validateEvidenceHref(id: string, href: string) {
  if (href === '/store/proof' || href.startsWith('/store/proof#')) {
    fail(`${id}: evidence cannot point back to the proof index`);
    return;
  }

  if (href.startsWith('/')) {
    if (!routeExists(href)) fail(`${id}: public evidence route does not exist: ${href}`);
    return;
  }

  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' || !allowedEvidenceHosts.has(url.hostname)) {
      fail(`${id}: evidence URL is not an approved Elevate HTTPS surface: ${href}`);
    }
  } catch {
    fail(`${id}: evidence href is invalid: ${href}`);
  }
}

function validateSourcePaths(id: string, sourcePaths: readonly string[]) {
  if (sourcePaths.length === 0) fail(`${id}: no implementation source paths declared`);
  for (const sourcePath of sourcePaths) {
    if (sourcePath.startsWith('/') || sourcePath.includes('..')) {
      fail(`${id}: source path must be repository-relative: ${sourcePath}`);
      continue;
    }
    const absolute = join(root, sourcePath);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) {
      fail(`${id}: implementation source does not exist: ${sourcePath}`);
      continue;
    }
    checkedSources.add(sourcePath);
  }
}

function validateProof(id: string, proof: StoreFeatureProof | StoreProductProof) {
  if (proof.title.trim().length < 3) fail(`${id}: proof title is missing`);
  if (proof.claim.trim().length < 20) fail(`${id}: proof claim is not concrete enough`);
  if (/coming soon|placeholder|todo|tbd|planned feature/i.test(`${proof.title} ${proof.claim}`)) {
    fail(`${id}: proof contains placeholder or future-tense language`);
  }
  validateEvidenceHref(id, proof.evidenceHref);
  validateSourcePaths(id, proof.sourcePaths);
}

function requireFeatureProof(key: PlatformFeatureKey, offeredBy: string) {
  checkedFeatures.add(key);
  const proof = STORE_FEATURE_PROOFS[key];
  if (!proof) {
    fail(`${offeredBy}: advertised feature has no proof record: ${key}`);
    return;
  }
  validateProof(`feature:${key}`, proof);
}

for (const capability of CAPABILITY_CATALOG.filter((item) => item.status !== 'internal')) {
  requireFeatureProof(capability.key, `capability:${capability.key}`);
  const proof = STORE_FEATURE_PROOFS[capability.key];
  if (capability.status === 'repair' && proof && !proof.limitation) {
    fail(`capability:${capability.key}: beta/repair capability must state its limitation`);
  }
}

for (const plan of Object.values(BASE_PLANS)) {
  if (plan.features.length === 0) fail(`plan:${plan.id}: no entitlement features declared`);
  for (const feature of plan.features) requireFeatureProof(feature, `plan:${plan.id}`);
}

const visibleAddons = ADD_ON_MARKETPLACE.filter((addon) => !addon.hiddenFromMarketplace);
for (const addon of visibleAddons) {
  if (addon.features.length === 0 && !(addon.slug in STORE_PRODUCT_PROOFS)) {
    fail(`addon:${addon.slug}: offer has neither feature proof nor product proof`);
  }
  for (const feature of addon.features) requireFeatureProof(feature, `addon:${addon.slug}`);
}

for (const [slug, app] of Object.entries(INDIVIDUAL_APP_CATALOG)) {
  const offer = COMMERCE_CATALOG.find((item) => item.id === slug);
  if (!offer) fail(`app:${app.slug}: missing from the public commerce catalog`);
}

const commerceIds = new Set<string>();
for (const offer of COMMERCE_CATALOG) {
  if (commerceIds.has(offer.id)) fail(`commerce:${offer.id}: duplicate public offer id`);
  commerceIds.add(offer.id);

  if (offer.proofFeatureKeys.length === 0 && !offer.proofProductId) {
    fail(`commerce:${offer.id}: public offer has no proof references`);
  }
  for (const feature of offer.proofFeatureKeys) requireFeatureProof(feature, `commerce:${offer.id}`);
  if (offer.proofProductId) {
    const proof = STORE_PRODUCT_PROOFS[offer.proofProductId];
    if (!proof) fail(`commerce:${offer.id}: product proof does not exist: ${offer.proofProductId}`);
    else validateProof(`product:${offer.proofProductId}`, proof);
  }
}

const publicAddonSlugs = new Set(visibleAddons.map((addon) => addon.slug));
for (const addon of ADD_ON_MARKETPLACE.filter((item) => item.hiddenFromMarketplace)) {
  if (publicAddonSlugs.has(addon.slug)) {
    fail(`addon:${addon.slug}: hidden compatibility product leaked into the public add-on catalog`);
  }
}

for (const [id, proof] of Object.entries(STORE_PRODUCT_PROOFS)) validateProof(`product:${id}`, proof);

if (failures.length) {
  console.error('[store-proof-contract] FAILED');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[store-proof-contract] PASS');
console.log(
  `${COMMERCE_CATALOG.length} public offers resolve to ${checkedFeatures.size} source-backed capabilities across ${checkedSources.size} implementation files`,
);
