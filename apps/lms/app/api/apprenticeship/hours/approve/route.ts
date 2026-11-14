import { NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import {
  approveAdminHours,
  HOURS_UUID_RE,
  validHoursSnapshots,
} from '@/lib/apprenticeship/approve-admin-hours';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function approve(req: NextRequest) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;
  // Same trusted session, role and configured MFA guard as the Admin queue.
  const actor = await apiRequireAdmin(req);
  if (actor.error) return actor.error;
  let body;
  try {
    body = await req.json();
  } catch {
    return safeError('Valid JSON is required', 400);
  }
  if (body?.action && body.action !== 'approve')
    return safeError(
      'Resolve disputes through the review workflow; approval cannot reject evidence',
      400,
    );
  const ids = req.method === 'PUT' ? (body?.hour_ids ?? body?.ids) : [body?.hour_id];
  if (
    !Array.isArray(ids) ||
    ids.length < 1 ||
    ids.length > 200 ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => typeof id !== 'string' || !HOURS_UUID_RE.test(id))
  )
    return safeError('Select 1–200 unique canonical apprenticeship hour IDs', 400);
  if (!validHoursSnapshots(ids, body?.expected))
    return safeError('Reviewed entry values are required. Refresh the hours queue.', 400);
  try {
    return await approveAdminHours(ids, actor.id, body.expected);
  } catch (error) {
    return safeInternalError(error, 'Approve canonical apprenticeship hours');
  }
}
export const POST = approve;
export const PUT = approve;
