import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
// xAPI (Experience API / Tin Can API) Client
// Tracks learning activities and sends statements to Learning Record Store (LRS)
export interface XAPIActor {
  mbox?: string;
  name: string;
  objectType: 'Agent' | 'Group';
}
export interface XAPIVerb {
  id: string;
  display: { [language: string]: string };
}
export interface XAPIActivity {
  id: string;
  definition?: {
    name?: { [language: string]: string };
    description?: { [language: string]: string };
    type?: string;
  };
  objectType: 'Activity';
}
export interface XAPIResult {
  score?: {
    scaled?: number; // 0-1
    raw?: number;
    min?: number;
    max?: number;
  };
  success?: boolean;
  completion?: boolean;
  duration?: string; // ISO 8601 duration
  extensions?: Record<string, unknown>;
}
export interface XAPIStatement {
  actor: XAPIActor;
  verb: XAPIVerb;
  object: XAPIActivity;
  result?: XAPIResult;
  timestamp?: string;
  context?: any;
}
export class XAPIClient {
  private endpoint: string;
  private auth: string;
  private enabled: boolean;
  constructor(endpoint?: string, username?: string, password?: string) {
    this.endpoint = endpoint || process.env.NEXT_PUBLIC_XAPI_ENDPOINT || '';
    this.enabled = !!this.endpoint;
    if (username && password) {
      this.auth = btoa(`${username}:${password}`);
    } else {
      this.auth = btoa(`${process.env.XAPI_USERNAME || ''}:${process.env.XAPI_PASSWORD || ''}`);
    }
  }
  async sendStatement(statement: XAPIStatement): Promise<void> {
    if (!this.enabled) {
      //
      return;
    }
    try {
      const response = await fetch(`${this.endpoint}/statements`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.auth}`,
          'Content-Type': 'application/json',
          'X-Experience-API-Version': '1.0.3',
        },
        body: JSON.stringify({
          ...statement,
          timestamp: statement.timestamp || new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error(`xAPI error: ${response.status} ${response.statusText}`);
      }
      //
    } catch (error) {
      /* Error handled silently */
      // Error: $1
      // Don't throw - we don't want tracking failures to break the app
    }
  }
  // Helper method to create actor from user
  createActor(userId: string, userName: string): XAPIActor {
    return {
      mbox: `mailto:${userId}@${PLATFORM_DEFAULTS.canonicalDomain}`,
      name: userName,
      objectType: 'Agent',
    };
  }
  // Common verbs
  static VERBS = {
    INITIALIZED: {
      id: 'http://adlnet.gov/expapi/verbs/initialized',
      display: { 'en-US': 'initialized' },
    },
    COMPLETED: {
      id: 'http://adlnet.gov/expapi/verbs/completed',
      display: { 'en-US': 'completed' },
    },
    PASSED: {
      id: 'http://adlnet.gov/expapi/verbs/passed',
      display: { 'en-US': 'passed' },
    },
    FAILED: {
      id: 'http://adlnet.gov/expapi/verbs/failed',
      display: { 'en-US': 'failed' },
    },
    ATTEMPTED: {
      id: 'http://adlnet.gov/expapi/verbs/attempted',
      display: { 'en-US': 'attempted' },
    },
    EXPERIENCED: {
      id: 'http://adlnet.gov/expapi/verbs/experienced',
      display: { 'en-US': 'experienced' },
    },
    ANSWERED: {
      id: 'http://adlnet.gov/expapi/verbs/answered',
      display: { 'en-US': 'answered' },
    },
  };
  // Track course started
  async trackCourseStarted(
    userId: string,
    userName: string,
    courseId: string,
    courseName: string,
  ): Promise<void> {
    await this.sendStatement({
      actor: this.createActor(userId, userName),
      verb: XAPIClient.VERBS.INITIALIZED,
      object: {
        id: `${PLATFORM_DEFAULTS.siteUrl}/courses/${courseId}`,
        definition: {
          name: { 'en-US': courseName },
          type: 'http://adlnet.gov/expapi/activities/course',
        },
        objectType: 'Activity',
      },
    });
  }
  // Track lesson completed
  async trackLessonCompleted(
    userId: string,
    userName: string,
    lessonId: string,
    lessonName: string,
    score?: number,
    duration?: number,
  ): Promise<void> {
    const result: XAPIResult = {
      completion: true,
    };
    if (score !== undefined) {
      result.success = score >= 70;
      result.score = {
        scaled: score / 100,
        raw: score,
        min: 0,
        max: 100,
      };
    }
    if (duration) {
      result.duration = `PT${duration}S`;
    }
    await this.sendStatement({
      actor: this.createActor(userId, userName),
      verb: XAPIClient.VERBS.COMPLETED,
      object: {
        id: `${PLATFORM_DEFAULTS.siteUrl}/lessons/${lessonId}`,
        definition: {
          name: { 'en-US': lessonName },
          type: 'http://adlnet.gov/expapi/activities/lesson',
        },
        objectType: 'Activity',
      },
      result,
    });
  }
  // Track quiz attempt
  async trackQuizAttempt(
    userId: string,
    userName: string,
    quizId: string,
    quizName: string,
    score: number,
    passed: boolean,
    duration?: number,
  ): Promise<void> {
    await this.sendStatement({
      actor: this.createActor(userId, userName),
      verb: passed ? XAPIClient.VERBS.PASSED : XAPIClient.VERBS.FAILED,
      object: {
        id: `${PLATFORM_DEFAULTS.siteUrl}/quizzes/${quizId}`,
        definition: {
          name: { 'en-US': quizName },
          type: 'http://adlnet.gov/expapi/activities/assessment',
        },
        objectType: 'Activity',
      },
      result: {
        score: {
          scaled: score / 100,
          raw: score,
          min: 0,
          max: 100,
        },
        success: passed,
        completion: true,
        duration: duration ? `PT${duration}S` : undefined,
      },
    });
  }
  // Track video watched
  async trackVideoWatched(
    userId: string,
    userName: string,
    videoId: string,
    videoName: string,
    duration: number,
    completionPercentage: number,
  ): Promise<void> {
    await this.sendStatement({
      actor: this.createActor(userId, userName),
      verb: XAPIClient.VERBS.EXPERIENCED,
      object: {
        id: `${PLATFORM_DEFAULTS.siteUrl}/videos/${videoId}`,
        definition: {
          name: { 'en-US': videoName },
          type: 'https://w3id.org/xapi/video/activity-type/video',
        },
        objectType: 'Activity',
      },
      result: {
        completion: completionPercentage >= 90,
        duration: `PT${duration}S`,
      },
    });
  }
}
// Singleton instance
let xapiClient: XAPIClient | null = null;
export function getXAPIClient(): XAPIClient {
  if (!xapiClient) {
    xapiClient = new XAPIClient();
  }
  return xapiClient;
}
