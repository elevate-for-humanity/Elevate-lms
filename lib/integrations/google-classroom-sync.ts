import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getGoogleClassroomCredentials,
  listGoogleClassroomCourses,
  refreshGoogleClassroomAccessToken,
} from './google-classroom';

export class ClassroomSyncError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export async function readConnectedClassroomCourses(db: SupabaseClient, userId: string) {
  const { data: token, error } = await db.from('integration_tokens')
    .select('access_token,refresh_token,expires_at,scopes')
    .eq('user_id', userId).eq('provider', 'google-classroom').maybeSingle();
  if (error) throw new ClassroomSyncError('Unable to read Google Classroom connection', 503);
  if (!token) throw new ClassroomSyncError('Google Classroom is not connected', 409);
  let accessToken = token.access_token;
  if (!accessToken || !token.expires_at || !Number.isFinite(Date.parse(token.expires_at)) || Date.parse(token.expires_at) <= Date.now() + 60_000) {
    if (!token.refresh_token) throw new ClassroomSyncError('Google Classroom authorization must be renewed', 409);
    const refreshed = await refreshGoogleClassroomAccessToken(token.refresh_token, await getGoogleClassroomCredentials());
    accessToken = refreshed.access_token;
    let update = db.from('integration_tokens').update({
      access_token: accessToken,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('provider', 'google-classroom');
    update = token.access_token == null ? update.is('access_token', null) : update.eq('access_token', token.access_token);
    const { error: saveError, data: saved } = await update.select('id');
    if (saveError || saved?.length !== 1)
      throw new ClassroomSyncError('Google Classroom authorization could not be saved; retry the connection check', 503);
  }
  return listGoogleClassroomCourses(accessToken);
}

/** Both entry routes use the same idempotent persistence and durable receipt. */
export async function synchronizeGoogleClassroom(db: SupabaseClient, userId: string) {
  const courses = await readConnectedClassroomCourses(db, userId);
  const now = new Date().toISOString();
  const rows = courses.map(course => ({
    user_id: userId, course_id: String(course.id),
    settings: { name: course.name, section: course.section, descriptionHeading: course.descriptionHeading,
      enrollmentCode: course.enrollmentCode, ownerId: course.ownerId, courseState: course.courseState,
      alternateLink: course.alternateLink },
    status: 'synced', last_sync_at: now, updated_at: now,
  }));
  if (rows.length) {
    const { error } = await db.from('google_classroom_sync').upsert(rows, { onConflict: 'user_id,course_id' });
    if (error) throw new ClassroomSyncError('Google Classroom course records could not be saved', 503);
  }
  const { error: integrationError } = await db.from('integrations').update({
    status: 'active', is_active: true, note: `${rows.length} course records synchronized successfully.`, updated_at: now,
  }).eq('slug', 'google-classroom');
  if (integrationError) throw new ClassroomSyncError('Google Classroom connection status could not be saved', 503);
  // Course counts are not contact/lead counts. Never fabricate those totals.
  const { error: receiptError } = await db.from('integration_sync_log').insert({
    provider: 'google-classroom', action: 'sync', status: 'success', created_at: now,
    records: { operation: 'synchronize', committed: true, actorId: userId, resources: { courses: rows.length } },
  });
  if (receiptError) throw new ClassroomSyncError('Course records saved, but synchronization receipt could not be saved; retry safely', 503);
  return { success: true, coursesSynchronized: rows.length, synchronizedAt: now };
}
