import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  getGoogleClassroomCredentials,
  listGoogleClassroomCourses,
  refreshGoogleClassroomAccessToken,
} from '@/lib/integrations/google-classroom';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const db = await requireAdminClient();
  const { data: token, error } = await db
    .from('integration_tokens')
    .select('access_token,refresh_token,expires_at,scopes')
    .eq('user_id', auth.id)
    .eq('provider', 'google-classroom')
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: 'Unable to read Google Classroom connection' },
      { status: 500 },
    );
  if (!token)
    return NextResponse.json({ error: 'Google Classroom is not connected' }, { status: 409 });
  try {
    let accessToken = token.access_token;
    if (!token.expires_at || new Date(token.expires_at).getTime() <= Date.now() + 60_000) {
      if (!token.refresh_token)
        return NextResponse.json(
          { error: 'Google Classroom authorization must be renewed' },
          { status: 409 },
        );
      const refreshed = await refreshGoogleClassroomAccessToken(
        token.refresh_token,
        await getGoogleClassroomCredentials(),
      );
      accessToken = refreshed.access_token;
      await db
        .from('integration_tokens')
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', auth.id)
        .eq('provider', 'google-classroom');
    }
    const courses = await listGoogleClassroomCourses(accessToken);
    const now = new Date().toISOString();
    const rows = courses.map((course) => ({
      user_id: auth.id,
      course_id: String(course.id),
      settings: {
        name: course.name,
        section: course.section,
        descriptionHeading: course.descriptionHeading,
        enrollmentCode: course.enrollmentCode,
        ownerId: course.ownerId,
        courseState: course.courseState,
        alternateLink: course.alternateLink,
      },
      status: 'synced',
      last_sync_at: now,
      updated_at: now,
    }));
    if (rows.length) {
      const { error: syncError } = await db
        .from('google_classroom_sync')
        .upsert(rows, { onConflict: 'user_id,course_id' });
      if (syncError) throw syncError;
    }
    const { error: integrationError } = await db
      .from('integrations')
      .update({
        status: 'active',
        is_active: true,
        note: `${rows.length} active course records synchronized successfully.`,
        updated_at: now,
      })
      .eq('slug', 'google-classroom');
    if (integrationError) throw integrationError;
    return NextResponse.json({
      success: true,
      coursesSynchronized: rows.length,
      synchronizedAt: now,
    });
  } catch {
    return NextResponse.json({ error: 'Google Classroom synchronization failed' }, { status: 502 });
  }
}
