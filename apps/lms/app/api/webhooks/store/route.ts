import { proxyCanonicalRoute } from '@/lib/api/canonical-route-proxy';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
// Marketing is the sole store-fulfillment writer.
export function POST(request: Request) {
  return proxyCanonicalRoute(request, 'marketing', '/api/webhooks/store');
}
