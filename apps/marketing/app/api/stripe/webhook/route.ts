/**
 * Stripe webhook compatibility path.
 *
 * Canonical endpoint: /api/webhooks/stripe
 * Keep this alias only for old provider configuration, but process the signed
 * request in-process so the webhook sender never depends on an HTTP redirect.
 */
import { POST as canonicalStripeWebhook } from '../../webhooks/stripe/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = canonicalStripeWebhook;
