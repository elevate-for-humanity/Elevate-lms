import { logger } from '@/lib/logger';

const SCORM_APP_ID = process.env.SCORM_APP_ID;
const SCORM_SECRET_KEY = process.env.SCORM_SECRET_KEY;
const SCORM_ENDPOINT = 'https://cloud.scorm.com/api/v2';

function getAuthHeader(): string {
  if (!SCORM_APP_ID || !SCORM_SECRET_KEY) {
    throw new Error('SCORM Cloud credentials not configured (SCORM_APP_ID, SCORM_SECRET_KEY)');
  }
  return 'Basic ' + Buffer.from(`${SCORM_APP_ID}:${SCORM_SECRET_KEY}`).toString('base64');
}

async function scormFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${SCORM_ENDPOINT}${path}`, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error(`SCORM Cloud API error: ${res.status} ${path}`, { body });
    throw new Error(`SCORM Cloud API returned ${res.status}`);
  }

  // Some endpoints return 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

/**
 * Import a SCORM package from a URL.
 * SCORM Cloud fetches the zip from fileUrl and processes it.
 */
export async function importScormPackage(courseId: string, fileUrl: string) {
  const result = await scormFetch(`/courses/importJobs`, {
    method: 'POST',
    body: JSON.stringify({
      courseId,
      url: fileUrl,
      mayCreateNewVersion: true,
    }),
  });

  return {
    jobId: result?.result,
    courseId,
  };
}

/**
 * Check the status of a course import job.
 */
export async function getImportJobStatus(jobId: string) {
  return scormFetch(`/courses/importJobs/${jobId}`);
}

/**
 * Get details about a SCORM course.
 */
export async function getScormCourse(courseId: string) {
  return scormFetch(`/courses/${courseId}`);
}

/**
 * Create a registration (enrollment) for a learner in a SCORM course.
 */
export async function createScormRegistration(
  registrationId: string,
  courseId: string,
  learnerId: string,
  learnerFirstName: string,
  learnerLastName: string,
) {
  await scormFetch(`/registrations`, {
    method: 'POST',
    body: JSON.stringify({
      registrationId,
      courseId,
      learner: {
        id: learnerId,
        firstName: learnerFirstName,
        lastName: learnerLastName,
      },
    }),
  });

  return { registrationId, courseId, learnerId };
}

/**
 * Get registration progress and completion status.
 */
export async function getScormRegistration(registrationId: string) {
  const data = await scormFetch(`/registrations/${registrationId}`);

  return {
    registrationId: data.id,
    courseId: data.course?.id,
    learnerId: data.learner?.id,
    completed: data.registrationCompletion === 'COMPLETED',
    completedDate: data.completedDate,
    score: data.score?.scaled ?? null,
    totalSecondsTracked: data.totalSecondsTracked,
    activityDetails: data.activityDetails,
  };
}

/**
 * Build a launch link for a learner to play a SCORM course.
 */
export async function buildLaunchLink(
  registrationId: string,
  redirectOnExitUrl: string,
) {
  const data = await scormFetch(`/registrations/${registrationId}/launchLink`, {
    method: 'POST',
    body: JSON.stringify({
      redirectOnExitUrl,
      expirySeconds: 3600,
    }),
  });

  return data.launchLink as string;
}

/**
 * Delete a SCORM course and all its registrations.
 */
export async function deleteScormCourse(courseId: string) {
  await scormFetch(`/courses/${courseId}`, { method: 'DELETE' });
}
