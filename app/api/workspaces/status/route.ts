// PUBLIC ROUTE: workspace provisioning status poll (slug or workspaceId)
import { NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeOk } from '@/lib/api/safe-error';
import { withRuntime } from '@/lib/api/withRuntime';
import { getWorkspaceStatus } from '@/lib/workspace/get-workspace-status';

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') ?? searchParams.get('id') ?? undefined;
  const slug = searchParams.get('slug') ?? undefined;

  if (!workspaceId && !slug) {
    return safeError('workspaceId or slug is required', 400);
  }

  try {
    const record = await getWorkspaceStatus({ workspaceId, slug });
    if (!record) {
      return safeError('Workspace not found', 404);
    }

    return safeOk({
      workspace: record,
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to load workspace status');
  }
}

export const GET = withRuntime(_GET);
