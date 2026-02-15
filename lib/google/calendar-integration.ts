/**
 * Google Calendar Integration using googleapis
 */

import { google } from 'googleapis';

const calendar = google.calendar('v3');

/**
 * Create OAuth2 client
 */
function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Add course schedule to Google Calendar
 */
export async function addCourseToCalendar(
  accessToken: string,
  courseData: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location?: string;
  }
) {
  const auth = getOAuth2Client();
  auth.setCredentials({ access_token: accessToken });

  const event = {
    summary: courseData.title,
    description: courseData.description,
    location: courseData.location,
    start: {
      dateTime: courseData.startDate.toISOString(),
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: courseData.endDate.toISOString(),
      timeZone: 'America/New_York',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 }, // 30 minutes before
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      auth,
      calendarId: 'primary',
      requestBody: event,
    });

    return {
      success: true,
      eventId: response.data.id,
      eventLink: response.data.htmlLink,
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Create recurring class schedule
 */
export async function createRecurringClassSchedule(
  accessToken: string,
  classData: {
    title: string;
    description: string;
    startDate: Date;
    startTime: string; // HH:MM format
    duration: number; // minutes
    recurrence: string; // RRULE format
    location?: string;
  }
) {
  const auth = getOAuth2Client();
  auth.setCredentials({ access_token: accessToken });

  const [hours, minutes] = classData.startTime.split(':').map(Number);
  const start = new Date(classData.startDate);
  start.setHours(hours, minutes, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + classData.duration);

  const event = {
    summary: classData.title,
    description: classData.description,
    location: classData.location,
    start: {
      dateTime: start.toISOString(),
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: 'America/New_York',
    },
    recurrence: [classData.recurrence],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      auth,
      calendarId: 'primary',
      requestBody: event,
    });

    return {
      success: true,
      eventId: response.data.id,
      eventLink: response.data.htmlLink,
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Get authorization URL for Google Calendar
 */
export function getCalendarAuthUrl(state?: string) {
  const auth = getOAuth2Client();

  return auth.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getCalendarTokens(code: string) {
  const auth = getOAuth2Client();

  try {
    const { tokens } = await auth.getToken(code);
    return {
      success: true,
      tokens,
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}
