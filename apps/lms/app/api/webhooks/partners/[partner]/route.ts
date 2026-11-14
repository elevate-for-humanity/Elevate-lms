import { proxyCanonicalRoute } from '@/lib/api/canonical-route-proxy';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
// Marketing owns partner verification and enrollment-state mutation.
export async function POST(request: Request, context: { params: Promise<{ partner: string }> }) {
  const { partner } = await context.params;
  return proxyCanonicalRoute(
    request,
    'marketing',
    `/api/webhooks/partners/${encodeURIComponent(partner)}`,
  );
}
