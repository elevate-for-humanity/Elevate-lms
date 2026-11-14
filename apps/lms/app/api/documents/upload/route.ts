import { proxyCanonicalRoute } from '@/lib/api/canonical-route-proxy';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
// LMS retains the URL; Admin owns protected storage and document-row creation.
export function POST(request: Request) {
  return proxyCanonicalRoute(request, 'admin', '/api/documents/upload');
}
