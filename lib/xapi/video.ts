// lib/xapi/video.ts
import { getXAPIClient } from './xapi-client';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type VideoStatementInput = {
  verb: 'initialized' | 'played' | 'paused' | 'completed' | 'seeked';
  videoId: string;
  courseId: string;
  lessonId?: string;
  learnerId: string;
  title: string;
  duration?: number;
  currentTime?: number;
};

export async function sendVideoStatement(input: VideoStatementInput) {
  const verbMap: Record<VideoStatementInput['verb'], string> = {
    initialized: 'http://adlnet.gov/expapi/verbs/initialized',
    played: 'https://w3id.org/xapi/video/verbs/played',
    paused: 'https://w3id.org/xapi/video/verbs/paused',
    completed: 'http://adlnet.gov/expapi/verbs/completed',
    seeked: 'https://w3id.org/xapi/video/verbs/seeked',
  };

  try {
    const client = getXAPIClient();

    const statement = {
      actor: client.createActor(input.learnerId, `User ${input.learnerId}`),
      verb: {
        id: verbMap[input.verb],
        display: { 'en-US': input.verb },
      },
      object: {
        id: `${PLATFORM_DEFAULTS.siteUrl}/video/${input.videoId}`,
        objectType: 'Activity' as const,
        definition: {
          name: { 'en-US': input.title },
          description: { 'en-US': `Video in course ${input.courseId}` },
          type: 'https://w3id.org/xapi/video/activity-type/video',
        },
      },
      context: {
        contextActivities: {
          parent: [
            {
              id: `${PLATFORM_DEFAULTS.siteUrl}/course/${input.courseId}`,
              objectType: 'Activity' as const,
            },
          ],
          ...(input.lessonId && {
            grouping: [
              {
                id: `${PLATFORM_DEFAULTS.siteUrl}/lesson/${input.lessonId}`,
                objectType: 'Activity' as const,
              },
            ],
          }),
        },
      },
      result: input.duration
        ? {
            extensions: {
              'https://w3id.org/xapi/video/extensions/time': input.currentTime || 0,
              'https://w3id.org/xapi/video/extensions/length': input.duration,
            },
          }
        : undefined,
    };

    await client.sendStatement(statement);
  } catch (error) {
    /* Error handled silently */
    // Error: $1
    // Don't throw - we don't want tracking failures to break the app
  }
}

// Helper to track video progress at intervals
export function createVideoProgressTracker(
  videoId: string,
  courseId: string,
  lessonId: string | undefined,
  learnerId: string,
  title: string,
) {
  let lastReportedTime = 0;
  const REPORT_INTERVAL = 30; // Report every 30 seconds

  return {
    trackProgress: (currentTime: number, duration: number) => {
      if (currentTime - lastReportedTime >= REPORT_INTERVAL) {
        sendVideoStatement({
          verb: 'played',
          videoId,
          courseId,
          lessonId,
          learnerId,
          title,
          currentTime,
          duration,
        });
        lastReportedTime = currentTime;
      }
    },
    trackCompletion: (duration: number) => {
      sendVideoStatement({
        verb: 'completed',
        videoId,
        courseId,
        lessonId,
        learnerId,
        title,
        currentTime: duration,
        duration,
      });
    },
  };
}
