import { proxyCanonicalRoute } from '@/lib/api/canonical-route-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Marketing owns the fail-closed retirement contract for this legacy URL.
// Keeping LMS as a mutation-free adapter prevents the two applications from
// drifting into separate billing behavior.
export function POST(request: Request) {
  return proxyCanonicalRoute(request, 'marketing', '/api/stripe/trial-checkout');
}
