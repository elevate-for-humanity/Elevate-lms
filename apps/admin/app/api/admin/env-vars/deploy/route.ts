/**
 * POST /api/admin/env-vars/deploy
 *
 * Triggers Northflank builds for LMS and Admin so updated runtime/build
 * variables are picked up by the deployed containers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import {
  getNorthflankProjectId,
  getNorthflankServices,
  isNorthflankReady,
  triggerNorthflankBuild,
} from '@/lib/northflank/runtime';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const projectId = getNorthflankProjectId();
  if (!projectId || !isNorthflankReady()) {
    return safeError('Northflank API credentials are not configured', 503);
  }

  const results = await Promise.all(
    getNorthflankServices().map(async (service) => {
      try {
        const build = await triggerNorthflankBuild(projectId, service.id);
        logger.info('[env-vars/deploy] Northflank build triggered', {
          service: service.id,
          userId: auth.id,
        });
        return { service: service.id, status: 'triggered', build };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('[env-vars/deploy] Northflank build failed', undefined, {
          service: service.id,
          error: message,
        });
        return { service: service.id, status: `failed: ${message.slice(0, 120)}` };
      }
    }),
  );

  const allOk = results.every((result) => result.status === 'triggered');
  return NextResponse.json({ triggered: allOk, results }, { status: allOk ? 200 : 502 });
}
