import 'server-only';

import { getSecrets } from '@/lib/secrets';

export const GOOGLE_CLASSROOM_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
] as const;

type GoogleCredentials = { clientId: string; clientSecret: string; redirectUri: string };
type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type: string;
};

export async function getGoogleClassroomCredentials(): Promise<GoogleCredentials> {
  const secrets = await getSecrets([
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CLASSROOM_REDIRECT_URI',
  ]);
  const clientId = secrets.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = secrets.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri =
    secrets.GOOGLE_CLASSROOM_REDIRECT_URI?.trim() ||
    'https://admin.elevateforhumanity.org/api/admin/integrations/google-classroom/callback';
  if (!clientId || !clientSecret) throw new Error('GOOGLE_CLASSROOM_CREDENTIALS_MISSING');
  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleClassroomAuthorizationUrl(
  credentials: GoogleCredentials,
  state: string,
): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', credentials.clientId);
  url.searchParams.set('redirect_uri', credentials.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_CLASSROOM_SCOPES.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeGoogleClassroomCode(
  code: string,
  credentials: GoogleCredentials,
): Promise<GoogleTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: credentials.redirectUri,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.access_token !== 'string' || !body.access_token.trim() ||
      !Number.isFinite(body.expires_in) || body.expires_in <= 0 || body.expires_in > 86400)
    throw new Error('GOOGLE_CLASSROOM_TOKEN_EXCHANGE_FAILED');
  return body as GoogleTokenResponse;
}

export async function refreshGoogleClassroomAccessToken(
  refreshToken: string,
  credentials: GoogleCredentials,
): Promise<GoogleTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.access_token !== 'string' || !body.access_token.trim() ||
      !Number.isFinite(body.expires_in) || body.expires_in <= 0 || body.expires_in > 86400)
    throw new Error('GOOGLE_CLASSROOM_TOKEN_REFRESH_FAILED');
  return { ...body, refresh_token: refreshToken } as GoogleTokenResponse;
}

export async function listGoogleClassroomCourses(accessToken: string) {
  const courses: Array<Record<string, unknown>> = [];
  const seenPages = new Set<string>();
  const seenCourses = new Set<string>();
  let pageToken = '';
  do {
    const url = new URL('https://classroom.googleapis.com/v1/courses');
    url.searchParams.set('courseStates', 'ACTIVE');
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
    });
    const body = await response.json();
    if (!response.ok || !body || typeof body !== 'object' || Array.isArray(body) ||
        (body.courses !== undefined && !Array.isArray(body.courses)))
      throw new Error('GOOGLE_CLASSROOM_COURSE_LIST_FAILED');
    for (const course of body.courses ?? []) {
      if (!course || typeof course.id !== 'string' || !course.id.trim())
        throw new Error('GOOGLE_CLASSROOM_COURSE_RESPONSE_INVALID');
      if (!seenCourses.has(course.id)) { seenCourses.add(course.id); courses.push(course); }
    }
    pageToken = typeof body.nextPageToken === 'string' ? body.nextPageToken : '';
    if (pageToken && (seenPages.has(pageToken) || seenPages.size >= 9 || courses.length >= 1000))
      throw new Error('GOOGLE_CLASSROOM_PAGINATION_INCOMPLETE');
    if (pageToken) seenPages.add(pageToken);
  } while (pageToken);
  return courses;
}
