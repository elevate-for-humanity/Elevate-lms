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
const stripeWebhook = 'apps/marketing/app/api/webhooks/stripe/route.ts';
const preSwitchDispatcher = 'lib/payments/career-course-webhook.ts';
const subscriptionProcessor = 'lib/platform/process-subscription-event.ts';
const featureCatalog = 'lib/platform/feature-catalog.ts';
const unifiedCourseMigration = 'supabase/migrations/20260822101500_add_unified_course_platform_addon.sql';

for (const path of [
  affirmCapture,
  enrollmentActivator,
  platformCheckout,
  billingPortal,
  stripeWebhook,
  preSwitchDispatcher,
  subscriptionProcessor,
  featureCatalog,
  unifiedCourseMigration,
]) read(path);

// Affirm: bind financing to an application/program, verify amount, make network
// operations idempotent, capture once, and enter the one enrollment activator.
requireText(affirmCapture, 'const expectedOrderPrefix = `${program}--${applicationId}--`', 'Affirm checkout must bind order, program, and application');
requireText(affirmCapture, "application.payment_status === 'paid'", 'Affirm capture must short-circuit an already-paid application');
requireText(affirmCapture, "application.payment_provider === 'affirm'", 'Affirm idempotency must be provider-specific');
requireText(affirmCapture, 'await affirm.authorizeCharge(checkoutToken, orderId)', 'Affirm must authorize before capture');
requireText(affirmCapture, 'await affirm.voidCharge(authorized.id)', 'Affirm must void a mismatched authorization');
requireText(affirmCapture, 'await affirm.captureCharge(authorized.id, orderId, expectedAmount)', 'Affirm must capture the verified canonical amount');
requireText(affirmCapture, 'await createEnrollmentFromPayment({', 'Affirm must use the canonical payment enrollment activator');
requireText(affirmCapture, "paymentProvider: 'affirm'", 'Affirm enrollment must persist the provider');
requireText(affirmCapture, "'enrollment_review_required'", 'Post-capture enrollment failure must route to operations review without recapture');
requireText(enrollmentActivator, "payment_status: 'paid'", 'Canonical payment enrollment must persist paid status');
requireText(enrollmentActivator, 'payment_provider: paymentProvider', 'Canonical payment enrollment must persist payment provider');

// Platform Stripe checkout: authenticated workspace billing, canonical prices,
// no duplicate active subscription, lifecycle synchronization, and traceability.
requireText(platformCheckout, 'await supabase.auth.getUser()', 'Platform checkout must require a real authenticated user');
requireText(platformCheckout, 'resolveBillingOrganizationId', 'Platform checkout must bind billing to the canonical organization');
requireText(platformCheckout, 'resolveCanonicalStripePrice', 'Platform checkout must resolve canonical plan pricing');
requireText(platformCheckout, 'ensureCanonicalStripePrice', 'Platform checkout must resolve canonical add-on pricing');
requireText(platformCheckout, "['active', 'trialing'].includes(existing.status || '')", 'Platform checkout must detect an existing active/trial subscription');
requireText(platformCheckout, 'await stripe.subscriptions.update(current.id', 'Plan changes must update the existing Stripe subscription instead of duplicating it');
requireText(platformCheckout, 'await syncPlatformSubscriptionLifecycle(admin, updated)', 'Plan changes must immediately sync canonical subscription state');
requireText(platformCheckout, "checkout_type: 'platform_saas'", 'Stripe checkout metadata must identify the canonical SaaS family');
requireText(platformCheckout, "mode: 'subscription'", 'Platform checkout must create a recurring Stripe Checkout session');
requireText(platformCheckout, 'addon?.hiddenFromMarketplace', 'Platform checkout must block hidden legacy add-ons from new purchase');
requireText(platformCheckout, 'legacy add-ons are no longer available for new purchase', 'Legacy add-on checkout rejection must remain explicit');

// Unified Course Creation & Learning Platform must resolve through one canonical
// commercial code and grant the complete builder/factory/LMS/certificate bundle.
requireText(featureCatalog, "'course-creation-learning-platform': 'course-creation-learning-platform'", 'Unified course product must normalize to its canonical add-on code');
requireText(featureCatalog, "'course-creation-learning-platform': [", 'Unified course product must have a code-side entitlement fallback');
requireText(featureCatalog, 'PlatformFeature.COURSE_BUILDER', 'Unified course product must grant Course Builder');
requireText(featureCatalog, 'PlatformFeature.COURSE_FACTORY', 'Unified course product must grant Course Factory');
requireText(featureCatalog, 'PlatformFeature.LMS', 'Unified course product must grant LMS');
requireText(featureCatalog, 'PlatformFeature.CERTIFICATES', 'Unified course product must grant certificates');
requireText(unifiedCourseMigration, "'course-creation-learning-platform'", 'Database catalog must seed the unified course product');
requireText(unifiedCourseMigration, "array['course_builder','course_factory','ai_content','lms','certificates']", 'Database entitlement bundle must match the unified course product');

// Canonical webhook: signed event construction, exactly-once protection, and
// fail-closed handling for destructive recurring/refund events.
requireText(stripeWebhook, 'constructStripeEventWithAnySecret', 'Canonical Stripe webhook must verify Stripe signatures');
requireText(stripeWebhook, ".from('stripe_webhook_events')", 'Canonical Stripe webhook must persist idempotency state');
requireText(stripeWebhook, "'customer.subscription.deleted'", 'Canonical Stripe webhook must classify subscription deletion as destructive');
requireText(stripeWebhook, "'customer.subscription.updated'", 'Canonical Stripe webhook must classify subscription updates as destructive');
requireText(stripeWebhook, "'invoice.payment_failed'", 'Canonical Stripe webhook must fail-close failed-invoice subscription mutations');
requireText(stripeWebhook, 'processCareerCourseStripeEvent(event)', 'Canonical Stripe webhook must run the verified-event pre-switch dispatcher');

// The verified-event dispatcher now sends recognized recurring families to the
// single subscription processor before legacy subscription logic can run.
requireText(preSwitchDispatcher, "import { processSubscriptionEvent } from '@/lib/platform/process-subscription-event'", 'Canonical verified-event dispatcher must use shared subscription processing');
requireText(preSwitchDispatcher, "'customer.subscription.created'", 'Dispatcher must accept subscription creation events');
requireText(preSwitchDispatcher, "'customer.subscription.updated'", 'Dispatcher must accept subscription update events');
requireText(preSwitchDispatcher, "'customer.subscription.deleted'", 'Dispatcher must accept subscription deletion events');
requireText(preSwitchDispatcher, "'invoice.payment_failed'", 'Dispatcher must accept invoice failure events');
requireText(preSwitchDispatcher, 'await processSubscriptionEvent(db, stripe, event)', 'Recognized recurring events must enter the canonical subscription processor');

// Shared recurring processor: organization SaaS, individual apps, and Host Shop
// subscriptions must be synchronized from the same verified Stripe event.
requireText(subscriptionProcessor, 'await syncPlatformSubscriptionLifecycle(db, subscription)', 'Recurring processor must sync organization SaaS state');
requireText(subscriptionProcessor, 'await syncIndividualAppLifecycle(db, subscription)', 'Recurring processor must sync individual-app state');
requireText(subscriptionProcessor, 'await syncHostShopSubscriptionLifecycle(db, subscription)', 'Recurring processor must sync Host Shop state');
requireText(subscriptionProcessor, "case 'customer.subscription.deleted':", 'Recurring processor must handle cancellations');
requireText(subscriptionProcessor, "case 'invoice.payment_failed':", 'Recurring processor must handle failed invoices');
requireText(subscriptionProcessor, ".from('subscription_invoices').upsert", 'Recurring processor must preserve invoice audit history');

// Billing portal must be authenticated and scoped to the caller's organization,
// so cancellation/payment-method management cannot cross tenant boundaries.
requireText(billingPortal, 'await sessionClient.auth.getUser()', 'Billing portal must require authentication');
requireText(billingPortal, 'resolveTenantIdForUser(user.id)', 'Billing portal must resolve the caller tenant');
requireText(billingPortal, 'resolveBillingOrganizationId(tenantId, db)', 'Billing portal must resolve the tenant billing organization');
requireText(billingPortal, ".eq('organization_id', organizationId)", 'Billing portal must load only the resolved organization subscription');
requireText(billingPortal, 'stripe.billingPortal.sessions.create({', 'Billing portal must use Stripe Billing Portal');

if (failures.length) {
  console.error('[payment-lifecycle-contract] FAILED');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[payment-lifecycle-contract] PASS');
console.log('Affirm capture/enrollment + Stripe checkout/webhook/subscription/billing contracts are canonical');
