import { NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import {
  approveAdminHours,
  HOURS_UUID_RE,
  validHoursSnapshots,
} from '@/lib/apprenticeship/approve-admin-hours';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return safeError('Valid JSON is required', 400);
  }
  const ids = (body as { ids?: unknown })?.ids;
  if (
    !Array.isArray(ids) ||
    ids.length < 1 ||
    ids.length > 200 ||
    ids.some((id) => typeof id !== 'string' || !HOURS_UUID_RE.test(id)) ||
    new Set(ids).size !== ids.length
  )
    return safeError('Select between 1 and 200 unique progress entries', 400);
  const expected = (body as { expected?: unknown })?.expected;
  if (!validHoursSnapshots(ids, expected))
    return safeError('Reviewed entry values are required. Refresh the queue.', 400);
  const resolution = (body as { resolution?: unknown }).resolution;
  if (
    resolution !== undefined &&
    (typeof resolution !== 'string' ||
      resolution.trim().length < 10 ||
      resolution.trim().length > 2000 ||
      ids.length !== 1)
  )
    return safeError(
      'Review one dispute at a time and enter a resolution note (10–2,000 characters).',
      400,
    );
  try {
    return typeof resolution === 'string'
      ? await approveAdminHours(ids, auth.id, expected, resolution.trim())
      : await approveAdminHours(ids, auth.id, expected);
  } catch (error) {
    return safeInternalError(error, 'Approve apprenticeship hours');
  }
}
