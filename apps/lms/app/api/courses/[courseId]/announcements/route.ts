import { proxyCanonicalRoute } from '@/lib/api/canonical-route-proxy';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
function path(courseId: string) {
  return `/api/courses/${encodeURIComponent(courseId)}/announcements`;
}
// LMS retains its URL while Admin owns reads, writes and notification fan-out.
export async function GET(request: Request, context: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await context.params;
  return proxyCanonicalRoute(request, 'admin', path(courseId));
}
export async function POST(request: Request, context: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await context.params;
  return proxyCanonicalRoute(request, 'admin', path(courseId));
}
