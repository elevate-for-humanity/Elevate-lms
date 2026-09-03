/**
 * ZOOM INTEGRATION
 *
 * Complete Zoom API integration for meetings, webinars, and recordings.
 * Supports OAuth 2.0 authentication and Server-to-Server OAuth.
 */

interface ZoomMeetingParams {
  topic: string;
  startTime: string;
  duration: number;
  agenda?: string;
  password?: string;
  timezone?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    waiting_room?: boolean;
    auto_recording?: 'local' | 'cloud' | 'none';
    approval_type?: 0 | 1 | 2; // 0=auto, 1=manual, 2=no registration
  };
}

interface ZoomMeeting {
  id: string;
  uuid: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  join_url: string;
  password: string;
  h323_password: string;
  pstn_password: string;
  encrypted_password: string;
  settings: any;
  start_url: string;
}

// In-process token cache — avoids a Zoom OAuth round-trip on every API call.
// Tokens are valid for 1 hour; we expire after 55 min to avoid edge races.
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

/**
 * Get Zoom access token using Server-to-Server OAuth.
 * Cached in-process for 55 minutes — one token fetch per container lifetime.
 */
async function getZoomAccessToken(): Promise<string> {
  // Ensure secrets are loaded from platform_secrets / SSM
  const { hydrateProcessEnv } = await import('@/lib/secrets');
  await hydrateProcessEnv();

  // Return cached token if still valid
  if (_cachedToken && Date.now() < _tokenExpiresAt) {
    return _cachedToken;
  }

  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      'Zoom OAuth credentials not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET',
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Zoom access token: ${error}`);
  }

  const data = await response.json();
  _cachedToken = data.access_token;
  // Zoom tokens are valid for 3600s; cache for 55 min to avoid expiry races
  _tokenExpiresAt = Date.now() + 55 * 60 * 1000;
  return _cachedToken!;
}

/**
 * Create a Zoom meeting
 */
export async function createZoomMeeting(params: ZoomMeetingParams): Promise<ZoomMeeting> {
  const accessToken = await getZoomAccessToken();
  const userId = process.env.ZOOM_USER_ID || 'me';

  const response = await fetch(`https://api.zoom.us/v2/users/${userId}/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      topic: params.topic,
      type: 2, // Scheduled meeting
      start_time: params.startTime,
      duration: params.duration,
      timezone: params.timezone || 'America/Indiana/Indianapolis',
      password: params.password,
      agenda: params.agenda,
      settings: {
        host_video: params.settings?.host_video ?? true,
        participant_video: params.settings?.participant_video ?? true,
        join_before_host: params.settings?.join_before_host ?? false,
        mute_upon_entry: params.settings?.mute_upon_entry ?? true,
        waiting_room: params.settings?.waiting_room ?? true,
        auto_recording: params.settings?.auto_recording ?? 'cloud',
        approval_type: params.settings?.approval_type ?? 0,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Get meeting details
 */
export async function getMeeting(meetingId: string): Promise<ZoomMeeting> {
  const accessToken = await getZoomAccessToken();

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Update a meeting
 */
export async function updateMeeting(
  meetingId: string,
  params: Partial<ZoomMeetingParams>,
): Promise<void> {
  const accessToken = await getZoomAccessToken();

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom API error: ${response.status} - ${error}`);
  }
}

/**
 * Delete a meeting
 */
export async function deleteMeeting(meetingId: string): Promise<void> {
  const accessToken = await getZoomAccessToken();

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom API error: ${response.status} - ${error}`);
  }
}

/**
 * List meetings for a user
 */
export async function listMeetings(userId: string = 'me'): Promise<ZoomMeeting[]> {
  const accessToken = await getZoomAccessToken();

  const response = await fetch(`https://api.zoom.us/v2/users/${userId}/meetings?type=scheduled`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.meetings || [];
}

/**
 * Get meeting participants
 */
export async function getMeetingParticipants(meetingId: string): Promise<any[]> {
  const accessToken = await getZoomAccessToken();

  const response = await fetch(
    `https://api.zoom.us/v2/metrics/meetings/${meetingId}/participants`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.participants || [];
}

/**
 * Get meeting recordings
 */
export async function getMeetingRecordings(meetingId: string): Promise<any> {
  const accessToken = await getZoomAccessToken();

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Create instant meeting (starts immediately)
 */
export async function createInstantMeeting(topic: string): Promise<ZoomMeeting> {
  const accessToken = await getZoomAccessToken();
  const userId = process.env.ZOOM_USER_ID || 'me';

  const response = await fetch(`https://api.zoom.us/v2/users/${userId}/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      topic,
      type: 1, // Instant meeting
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

// Alias for backwards compatibility
export const createMeeting = createZoomMeeting;
