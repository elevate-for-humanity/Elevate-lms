/**
 * Centralized required-secret groups for withRuntime().
 *
 * Use these instead of inline string arrays so secret names are
 * defined once and can be audited in one place.
 *
 * Usage:
 *   export const POST = withRuntime(
 *     { secrets: ENV.STRIPE, rateLimit: 'payment' },
 *     async (req, ctx) => { const key = ctx.env.STRIPE_SECRET_KEY; ... }
 *   );
 */

export const ENV = {
  STRIPE:   ['STRIPE_SECRET_KEY'] as const,
  STRIPE_WEBHOOK: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] as const,
  STRIPE_TESTING_WEBHOOK: ['STRIPE_SECRET_KEY', 'STRIPE_TESTING_WEBHOOK_SECRET'] as const,
  CALENDLY: ['CALENDLY_WEBHOOK_SECRET'] as const,
  CRON:     ['CRON_SECRET'] as const,
  SENDGRID: ['SENDGRID_API_KEY'] as const,
} satisfies Record<string, readonly string[]>;
