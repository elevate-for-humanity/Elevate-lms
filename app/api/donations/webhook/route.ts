/**
 * Stripe webhook endpoint alias.
 *
 * Stripe's dashboard is configured to POST to /api/donations/webhook.
 * The actual handler lives at /api/donate/webhook. This route forwards
 * the raw request body and all headers so signature verification passes.
 *
 * Do NOT redirect (302/307) — Stripe does not follow redirects for webhooks.
 * We must proxy the request inline.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const body = await request.arrayBuffer();

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  // Use public app URL to ensure HTTPS for internal fetch
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.elevateforhumanity.org';
  
  const response = await fetch(
    `${baseUrl}/api/donate/webhook`,
    {
      method: 'POST',
      headers,
      body,
    },
  );

  const responseBody = await response.arrayBuffer();
  return new Response(responseBody, {
    status: response.status,
    headers: response.headers,
  });
}
