import { proxyCanonicalRoute } from '@/lib/api/canonical-route-proxy';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const PATH = '/api/webhooks/stripe';
// Marketing owns Stripe processing; raw signed bytes are forwarded unchanged.
export function POST(request: Request) {
  return proxyCanonicalRoute(request, 'marketing', PATH);
}
export function GET(request: Request) {
  return proxyCanonicalRoute(request, 'marketing', PATH);
}
