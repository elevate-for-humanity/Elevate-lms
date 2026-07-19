/**
 * Dependency-free readiness probe for Marketing container.
 * 
 * This endpoint answers ONE question: "Can the container accept HTTP traffic?"
 * 
 * It does NOT check:
 * - Supabase connectivity
 * - Stripe connectivity
 * - Redis connectivity
 * - External network calls
 * - Authentication
 * 
 * Integration diagnostics belong in a separate observability endpoint.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(
    {
      status: 'ok',
      service: 'marketing',
      commit:
        process.env.COMMIT_SHA ??
        process.env.GIT_SHA ??
        process.env.NEXT_PUBLIC_COMMIT_SHA ??
        'unknown',
      buildTime:
        process.env.BUILD_TIME ??
        process.env.NEXT_PUBLIC_BUILD_TIME ??
        'unknown',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
