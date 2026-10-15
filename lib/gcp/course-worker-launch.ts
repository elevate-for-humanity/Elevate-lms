import { dispatchGoogleDeployment } from './dispatch-production-workflow';
import { startDeployedCourseWorker } from './direct-course-worker-launch';
import { logger } from '@/lib/logger';

/**
 * Request the existing checkpointed Course Builder worker.
 * Acknowledged dispatch is not proof of a claimed job or finished video.
 * Prefer the Cloud Run service identity to avoid depending on a GitHub token
 * when the administrator presses Start/Resume; fall back to trusted GitHub.
 */
export async function requestCourseWorker(
  dispatch = () => dispatchGoogleDeployment('course-builder'),
  direct = () => startDeployedCourseWorker(),
) {
  try {
    return await direct();
  } catch (googleError) {
    const googleReason = googleError instanceof Error ? googleError.message : 'UNKNOWN_GOOGLE_ERROR';
    logger.warn('Direct Google course worker execution unavailable', {
      reason: googleReason,
    });
    try {
      const result = await dispatch();
      return {
        dispatched: true,
        launchMode: 'github-workflow',
        executionVerified: false,
        actionsUrl: result.actionsUrl,
        message: 'Trusted GitHub course worker dispatch accepted; awaiting worker heartbeat.',
      };
    } catch (githubError) {
      const githubReason = githubError instanceof Error ? githubError.message : 'UNKNOWN_GITHUB_ERROR';
      logger.error('Course Builder worker launch failed through both authorized paths', {
        google: googleReason,
        github: githubReason.replace(/Bearer\\s+\\S+/gi, '[redacted]'),
      });
      return {
        dispatched: false,
        launchMode: 'scheduled',
        executionVerified: false,
        dispatchError: googleReason.startsWith('GOOGLE_') ? googleReason : 'COURSE_WORKER_LAUNCH_UNAVAILABLE',
        message: 'Existing build remains saved, but neither Cloud Run nor trusted GitHub accepted an execution. Scheduled recovery may retry; do not report the course as running.',
      };
    }
  }
}
