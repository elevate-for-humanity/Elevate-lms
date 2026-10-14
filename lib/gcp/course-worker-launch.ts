import { dispatchGoogleDeployment } from './dispatch-production-workflow';
import { logger } from '@/lib/logger';

/** Call only after verifying the durable queue write. The trusted coordinator
 * scans that queue independently of Admin's optional GitHub dispatch token. */
export async function requestCourseWorker(dispatch = () => dispatchGoogleDeployment('course-builder')) {
  try {
    const result = await dispatch();
    return { dispatched: true, launchMode: 'direct', executionVerified: false, actionsUrl: result.actionsUrl,
      message: 'Worker launch requested. Waiting for a live worker heartbeat.' };
  } catch (error) {
    const reason = error instanceof Error && /HTTP 401/.test(error.message) ? 'authentication_rejected' : 'direct_dispatch_unavailable';
    logger.warn('Course worker launch deferred to durable coordinator', { reason });
    return { dispatched: false, launchMode: 'scheduled', executionVerified: false,
      message: 'Saved in the worker queue. The automatic Google dispatcher will pick up the request; execution is not confirmed yet.' };
  }
}
