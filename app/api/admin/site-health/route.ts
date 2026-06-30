/**
 * Thin proxy — delegates to apps/admin canonical implementation.
 * Auth enforced in the canonical handler via apiRequireAdmin.
 * Next.js requires runtime/dynamic to be declared in the file itself, not re-exported.
 */
import { type NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { GET as adminGET } from '@/apps/admin/app/api/admin/site-health/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return adminGET(request);
}
