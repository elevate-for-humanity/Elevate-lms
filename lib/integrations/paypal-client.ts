import 'server-only';

import { hydrateProcessEnv } from '@/lib/secrets';

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  billingWebhookId: string;
}

type PayPalErrorBody = {
  name?: string;
  message?: string;
  details?: Array<{ description?: string }>;
};

export async function loadPayPalConfig(): Promise<PayPalConfig> {
  await hydrateProcessEnv();
  const environment =
    process.env.PAYPAL_ENVIRONMENT === 'production' || process.env.PAYPAL_ENVIRONMENT === 'live'
      ? 'production'
      : 'sandbox';
  return {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    environment,
    billingWebhookId: process.env.PAYPAL_BILLING_WEBHOOK_ID || '',
  };
}

export function payPalApiBase(config: Pick<PayPalConfig, 'environment'>): string {
  return config.environment === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function payPalAccessToken(config: PayPalConfig): Promise<string> {
  if (!config.clientId || !config.clientSecret) {
    throw new Error('PayPal billing is not configured. Add the PayPal REST client credentials.');
  }
  const response = await fetch(`${payPalApiBase(config)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  const body = (await response.json().catch(() => ({}))) as { access_token?: string } & PayPalErrorBody;
  if (!response.ok || !body.access_token) {
    throw new Error(body.message || `PayPal authentication failed (${response.status}).`);
  }
  return body.access_token;
}

export async function payPalRequest<T>(
  path: string,
  init: RequestInit = {},
  requestId?: string,
): Promise<T> {
  const config = await loadPayPalConfig();
  const token = await payPalAccessToken(config);
  const response = await fetch(`${payPalApiBase(config)}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
      'content-type': 'application/json',
      ...(requestId ? { 'PayPal-Request-Id': requestId.slice(0, 108) } : {}),
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const body = (await response.json().catch(() => ({}))) as T & PayPalErrorBody;
  if (!response.ok) {
    const detail = body.details?.find((item) => item.description)?.description;
    throw new Error(detail || body.message || `PayPal request failed (${response.status}).`);
  }
  return body;
}

export async function verifyPayPalBillingWebhook(
  headers: Headers,
  event: Record<string, unknown>,
): Promise<boolean> {
  const config = await loadPayPalConfig();
  if (!config.billingWebhookId) {
    throw new Error('PayPal billing webhook verification is not configured.');
  }
  const result = await payPalRequest<{ verification_status?: string }>(
    '/v1/notifications/verify-webhook-signature',
    {
      method: 'POST',
      body: JSON.stringify({
        auth_algo: headers.get('paypal-auth-algo'),
        cert_url: headers.get('paypal-cert-url'),
        transmission_id: headers.get('paypal-transmission-id'),
        transmission_sig: headers.get('paypal-transmission-sig'),
        transmission_time: headers.get('paypal-transmission-time'),
        webhook_id: config.billingWebhookId,
        webhook_event: event,
      }),
    },
  );
  return result.verification_status === 'SUCCESS';
}
