import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { validateStudentPortalAccess } from '@/lib/auth/student-access';
import { repairStudentPortalAccess } from '@/lib/auth/repair-student-access';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

// POST /api/admin/student-access
// body: { email: string; repair?: boolean }
// Validates student portal access. Pass repair: true to auto-fix broken state.
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  let body: { email?: string; repair?: boolean };
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const { email, repair } = body;

  if (!email || typeof email !== 'string') {
    return safeError('email is required', 400);
  }

  try {
    if (repair) {
      const result = await repairStudentPortalAccess(email);
      return NextResponse.json(result);
    }

    const result = await validateStudentPortalAccess(email);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return safeInternalError(err, 'Student access check failed');
  }
}
