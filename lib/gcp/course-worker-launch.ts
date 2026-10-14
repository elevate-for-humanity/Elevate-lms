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
    return { dispatched: false, launchMode: 'scheduled', executionVerified: false, dispatchError: reason,
      message: reason === 'authentication_rejected'
        ? 'Repair is saved, but direct worker launch was rejected by GitHub (401). The scheduled coordinator may recover it; no worker start is confirmed.'
        : 'Request saved, but direct worker launch is unavailable. Waiting for the scheduled coordinator; no worker start is confirmed.' };
  }
}
