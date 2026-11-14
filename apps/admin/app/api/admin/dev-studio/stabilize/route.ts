import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { queuePlatformQa } from '@/lib/devstudio/queue-platform-qa';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
type StabilizeRequest = {
  quick?: boolean;
  includeTests?: boolean;
  includeSmoke?: boolean;
  maxOutputKb?: number;
};
const DEFAULTS = { quick: true, includeTests: true, includeSmoke: false, maxOutputKb: 256 };

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  try {
    const body = (await request.json().catch(() => ({}))) as StabilizeRequest;
    const options = { ...DEFAULTS, ...body };
    if (typeof options.maxOutputKb !== 'number' || !Number.isFinite(options.maxOutputKb) || options.maxOutputKb < 32 || options.maxOutputKb > 2048) {
      return safeError('maxOutputKb must be between 32 and 2048', 400);
    }
    // Retain legacy request options as context. The obsolete local audit scripts
    // are replaced by the canonical CI suite, including its required tests.
    const result = await queuePlatformQa();
    if (result.status === 'failed') {
      const { httpStatus, ...failure } = result;
      return NextResponse.json(failure, { status: httpStatus });
    }
    return NextResponse.json({
      ...result,
      options,
      results: [],
      summary: 'Stabilization checks are queued in CI; no checks have been marked passed.',
      nextActions: ['Open the workflow report and review completed checks before committing fixes.'],
      timestamp: new Date().toISOString(),
    }, { status: 202 });
  } catch (error) {
    return safeInternalError(error, 'Unable to queue stabilization checks');
  }
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  return NextResponse.json({
    endpoint: '/api/admin/dev-studio/stabilize',
    method: 'POST',
    execution: 'github-actions',
    workflow: 'ci.yml',
    body: {
      quick: 'legacy request context; CI runs the canonical suite',
      includeTests: 'legacy request context; required CI tests remain enabled',
      includeSmoke: 'legacy request context; CI owns its smoke checks',
      maxOutputKb: 'number 32..2048 (default 256); logs are available in the workflow report',
    },
  });
}
