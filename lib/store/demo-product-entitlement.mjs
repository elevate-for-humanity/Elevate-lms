/**
 * Map a sales-demo product key to the subscription a customer should receive.
 *
 * A demo shows what a specific subscription can do, so converting that demo
 * must grant that product's access — never a hard-coded app. Individual apps
 * (website-builder, sam-gov, grants) provision a user_app_subscriptions row;
 * platform products (plans, add-ons, the community hub) provision the
 * organization workspace trial.
 */

/** Demo product keys that grant an individual app subscription. */
const INDIVIDUAL_APP_PRODUCTS = {
  'website-builder': 'website-builder',
  'sam-gov': 'sam-gov',
  'sam-gov-manager': 'sam-gov',
  grants: 'grants',
  'grants-discovery': 'grants',
};

/** Demo keys that only make sense inside an organization workspace. */
const WORKSPACE_PRODUCTS = new Set([
  'platform', 'community-hub', 'solo', 'business', 'professional', 'enterprise',
  'employer', 'employer-portal', 'workforce', 'workforce-board', 'student',
  'student-portal', 'admin', 'admin-dashboard', 'instructor', 'lms', 'crm',
  'ai-studio', 'website',
]);

/**
 * Resolve the entitlement a demo conversion should grant. Unknown or missing
 * product keys fall back to the workspace trial, which never mis-provisions an
 * individual app the customer did not see.
 */
export function resolveDemoProductEntitlement(productKey) {
  const key = String(productKey ?? '').trim().toLowerCase().replace(/_/g, '-');
  const appSlug = INDIVIDUAL_APP_PRODUCTS[key];
  if (appSlug) return { kind: 'individual_app', appSlug };
  return { kind: 'workspace' };
}
