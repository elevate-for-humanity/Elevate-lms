import { proxyCanonicalRoute } from '@/lib/api/canonical-route-proxy';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Marketing owns trial validation, customer linkage and checkout creation.
export function POST(request: Request) {
  return proxyCanonicalRoute(request, 'marketing', '/api/stripe/trial-checkout');
}
