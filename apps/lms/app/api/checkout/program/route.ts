import { proxyCanonicalRoute } from '@/lib/api/canonical-route-proxy';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// Marketing owns the unified program and partner-course checkout contract.
export function POST(request: Request) {
  return proxyCanonicalRoute(request, 'marketing', '/api/checkout/program');
}
