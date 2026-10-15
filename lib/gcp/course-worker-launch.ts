import { dispatchGoogleDeployment } from './dispatch-production-workflow';
import { startDeployedCourseWorker } from './direct-course-worker-launch';
import { logger } from '@/lib/logger';

/** Start the durable job from Admin, without requiring Cloud Shell.
 * GitHub trusted release dispatch is primary; native Cloud Run service identity
 * provides a Google-only fallback when its GitHub credential is unavailable.
 * A successful dispatch is not a completed course or a heartbeat.
 */
export async function requestCourseWorker(
  dispatch = () => dispatchGoogleDeployment('course-builder'),
  direct = () => startDeployedCourseWorker(),
) {
  try {
    return await launchWithGoogleRuntimeIdentity();
  } catch (googleError) {
    logger.warn('Direct Google worker execution unavailable', {
      reason: googleError instanceof Error ? googleError.message : 'unknown',
    });
  }
  try {
    const result = await dispatch();
    return { dispatched: true, launchMode: 'github-workflow', executionVerified: false, actionsUrl: result.actionsUrl,
      message: 'Google worker launch requested through the trusted GitHub workflow. Waiting for a live worker heartbeat.' };
  } catch (error) {
    const reason = error instanceof Error && /HTTP 401/.test(error.message) ? 'authentication_rejected' : 'direct_dispatch_unavailable';
    logger.warn('Course worker launch deferred to durable coordinator', { reason });
    return { dispatched: false, launchMode: 'scheduled', executionVerified: false, dispatchError: reason,
      message: 'Course progress is saved, but worker execution was not accepted. Admin runtime needs permission to execute the Google Cloud job or a working trusted dispatch connection. No course restart was confirmed.' };
    return { dispatched: true, launchMode: 'github-actions', executionVerified: false,
      actionsUrl: result.actionsUrl,
      message: 'Course worker dispatch accepted. Waiting for the worker to claim this saved build.' };
  } catch (primaryError) {
    try {
      return await direct();
    } catch (directError) {
      const primaryReason = primaryError instanceof Error ? primaryError.message : 'Unknown dispatch failure';
      const directReason = directError instanceof Error ? directError.message : 'Unknown Cloud Run failure';
      logger.error('Course Builder could not launch either trusted dispatcher', {
        github: primaryReason.replace(/Bearer\\s+\\S+/gi, '[redacted]'),
        google: directReason,
      });
      return { dispatched: false, launchMode: 'scheduled', executionVerified: false,
        dispatchError: directReason.startsWith('GOOGLE_') ? directReason : 'COURSE_WORKER_LAUNCH_UNAVAILABLE',
        message: 'Build saved, but the worker did not start. GitHub dispatch and the Admin Google service identity both failed. Verify the production GitHub token or grant the Admin service account Cloud Run jobs.run on the existing elevate-course-builder job. The scheduler may still recover this build.' };
    }
  }
}
