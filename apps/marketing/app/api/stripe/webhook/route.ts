/**
 * Stripe webhook compatibility path.
 *
 * Canonical endpoint: /api/webhooks/stripe
 * Keep this alias only for old provider configuration, but process the signed
 * request in-process so the webhook sender never depends on an HTTP redirect.
 */
export { POST, runtime, dynamic, maxDuration } from '../../webhooks/stripe/route';
