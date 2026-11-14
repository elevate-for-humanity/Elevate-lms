import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function read(path) {
  const full = join(root, path);
  if (!existsSync(full)) {
    failures.push(`missing required payment file: ${path}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

function requireText(path, text, message) {
  const content = read(path);
  if (content && !content.includes(text)) failures.push(message || `${path} missing ${text}`);
}

const affirmCapture = 'apps/lms/app/api/affirm/capture/route.ts';
const enrollmentActivator = 'lib/enrollment/create-enrollment.ts';
const platformCheckout = 'apps/marketing/app/api/store/platform-checkout/route.ts';
const billingPortal = 'apps/marketing/app/api/store/billing-portal/route.ts';
const quickBooksWebhook = 'apps/marketing/app/api/webhooks/quickbooks/route.ts';
const fulfillment = 'lib/billing/fulfillment.ts';
const featureCatalog = 'lib/platform/feature-catalog.ts';
const unifiedCourseMigration =
  'supabase/migrations/20260822101500_add_unified_course_platform_addon.sql';

for (const path of [
  affirmCapture,
  enrollmentActivator,
  platformCheckout,
  billingPortal,
  quickBooksWebhook,
  fulfillment,
  featureCatalog,
  unifiedCourseMigration,
])
  read(path);

// Affirm: bind financing to an application/program, verify amount, make network
// operations idempotent, capture once, and enter the one enrollment activator.
requireText(
  affirmCapture,
  'const expectedOrderPrefix = `${program}--${applicationId}--`',
  'Affirm checkout must bind order, program, and application',
);
requireText(
  affirmCapture,
  "application.payment_status === 'paid'",
  'Affirm capture must short-circuit an already-paid application',
);
requireText(
  affirmCapture,
  "application.payment_provider === 'affirm'",
  'Affirm idempotency must be provider-specific',
);
requireText(
  affirmCapture,
  'await affirm.authorizeCharge(checkoutToken, orderId)',
  'Affirm must authorize before capture',
);
requireText(
  affirmCapture,
  'await affirm.voidCharge(authorized.id)',
  'Affirm must void a mismatched authorization',
);
requireText(
  affirmCapture,
  'await affirm.captureCharge(authorized.id, orderId, expectedAmount)',
  'Affirm must capture the verified canonical amount',
);
requireText(
  affirmCapture,
  'await createEnrollmentFromPayment({',
  'Affirm must use the canonical payment enrollment activator',
);
requireText(
  affirmCapture,
  "paymentProvider: 'affirm'",
  'Affirm enrollment must persist the provider',
);
requireText(
  affirmCapture,
  "'enrollment_review_required'",
  'Post-capture enrollment failure must route to operations review without recapture',
);
requireText(
  enrollmentActivator,
  "payment_status: 'paid'",
  'Canonical payment enrollment must persist paid status',
);
requireText(
  enrollmentActivator,
  'payment_provider: paymentProvider',
  'Canonical payment enrollment must persist payment provider',
);

// Platform checkout: authenticated workspace billing, canonical catalog pricing,
// QuickBooks invoice + recurring schedule creation, and duplicate-billing protection.
requireText(
  platformCheckout,
  'await supabase.auth.getUser()',
  'Platform checkout must require a real authenticated user',
);
requireText(
  platformCheckout,
  'resolveBillingOrganizationId',
  'Platform checkout must bind billing to the canonical organization',
);
requireText(
  platformCheckout,
  'getBasePlan(planId)',
  'Platform checkout must resolve canonical plan pricing',
);
requireText(
  platformCheckout,
  'addonSlugs.map(getAddOn)',
  'Platform checkout must resolve canonical add-on pricing',
);
requireText(
  platformCheckout,
  "['active', 'trialing'].includes(existing.status || '')",
  'Platform checkout must detect an existing active/trial subscription',
);
requireText(
  platformCheckout,
  'existing?.provider_subscription_id',
  'Platform checkout must detect an existing provider subscription',
);
requireText(
  platformCheckout,
  'preventing duplicate billing',
  'Provider cutover must block duplicate billing',
);
requireText(
  platformCheckout,
  'createQuickBooksBillingProvider(admin).createManualInvoice({',
  'Platform checkout must create the canonical QuickBooks invoice',
);
requireText(
  platformCheckout,
  ".from('billing_schedules').upsert(",
  'Platform checkout must persist the recurring billing schedule',
);
requireText(
  platformCheckout,
  "provider: 'quickbooks'",
  'Platform checkout must identify QuickBooks as the billing provider',
);
requireText(
  platformCheckout,
  'addon.hiddenFromMarketplace',
  'Platform checkout must block hidden legacy add-ons from new purchase',
);
requireText(
  platformCheckout,
  "error: 'One or more add-ons are unavailable'",
  'Legacy add-on checkout rejection must remain explicit',
);

// Unified Course Creation & Learning Platform must resolve through one canonical
// commercial code and grant the complete builder/factory/LMS/certificate bundle.
requireText(
  featureCatalog,
  "'course-creation-learning-platform': 'course-creation-learning-platform'",
  'Unified course product must normalize to its canonical add-on code',
);
requireText(
  featureCatalog,
  "'course-creation-learning-platform': [",
  'Unified course product must have a code-side entitlement fallback',
);
requireText(
  featureCatalog,
  'PlatformFeature.COURSE_BUILDER',
  'Unified course product must grant Course Builder',
);
requireText(
  featureCatalog,
  'PlatformFeature.COURSE_FACTORY',
  'Unified course product must grant Course Factory',
);
requireText(featureCatalog, 'PlatformFeature.LMS', 'Unified course product must grant LMS');
requireText(
  featureCatalog,
  'PlatformFeature.CERTIFICATES',
  'Unified course product must grant certificates',
);
requireText(
  unifiedCourseMigration,
  "'course-creation-learning-platform'",
  'Database catalog must seed the unified course product',
);
requireText(
  unifiedCourseMigration,
  "array['course_builder','course_factory','ai_content','lms','certificates']",
  'Database entitlement bundle must match the unified course product',
);

// Canonical provider-neutral payment lifecycle: QuickBooks webhook queues
// fulfillment and fulfillment activates the purchased resource.
requireText(
  quickBooksWebhook,
  'billing_fulfillment_jobs',
  'QuickBooks webhook must queue canonical fulfillment jobs',
);
requireText(
  quickBooksWebhook,
  "provider: 'quickbooks'",
  'QuickBooks webhook must identify the active provider',
);
requireText(
  fulfillment,
  "job.fulfillment_type === 'program_enrollment'",
  'Fulfillment must activate program enrollments',
);
requireText(
  fulfillment,
  "job.fulfillment_type === 'testing_booking'",
  'Fulfillment must create paid testing bookings',
);
requireText(
  fulfillment,
  "job.fulfillment_type === 'individual_app_subscription'",
  'Fulfillment must activate individual app subscriptions',
);
requireText(
  fulfillment,
  "job.fulfillment_type === 'testing_enforcement'",
  'Fulfillment must clear paid testing enforcement fees',
);

// The portal is a same-Store navigation endpoint. Authorization belongs at the
// customer data/action boundary and must support individual buyers without a tenant.
const customerBilling = 'lib/store/customer-billing.ts';
const billingManagement = 'apps/marketing/app/api/store/account/billing/route.ts';
requireText(
  billingPortal,
  'await sessionClient.auth.getUser()',
  'Billing navigation must require authentication',
);
requireText(
  billingPortal,
  'https://store.elevateforhumanity.org/store/account/billing',
  'Store billing must stay in the Store account workspace',
);
requireText(
  customerBilling,
  ".eq('user_id', userId)",
  'Billing ownership must bind to the verified user',
);
requireText(
  customerBilling,
  ".in('role', ['owner', 'admin'])",
  'Organization invoices require an explicit owner/admin membership',
);
requireText(customerBilling, ".eq('status', 'active')", 'New tenant memberships must be active');
requireText(
  customerBilling,
  ".in('customer_external_key', keys)",
  'Invoices and schedules must be scoped to verified billing identities',
);
requireText(
  customerBilling,
  'const keys = [`user:${userId}`]',
  'Individual customers must retain their own billing identity',
);
requireText(
  billingManagement,
  'apiRequireRoles(request, ALL_AUTHENTICATED_ROLES)',
  'Invoice-schedule changes must use the shared account/MFA guard',
);
requireText(
  billingManagement,
  ".in('customer_external_key', keys)",
  'Cancellation must not cross customer or organization boundaries',
);
requireText(
  billingManagement,
  ".eq('collection_mode', 'manual_invoice')",
  'Manual invoice cancellation must not silently claim to cancel a legacy automatic agreement',
);

if (failures.length) {
  console.error('[payment-lifecycle-contract] FAILED');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[payment-lifecycle-contract] PASS');
console.log(
  'Affirm capture/enrollment + QuickBooks checkout + provider-neutral fulfillment contracts are canonical',
);
