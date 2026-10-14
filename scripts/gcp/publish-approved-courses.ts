import { createClient } from '@supabase/supabase-js';
import { UltimateReleaseService } from '../../lib/ultimate-course-builder/release/release-service';
import { publishApprovedCourses } from './approved-course-publication.mjs';

async function main() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('COURSE_PUBLICATION_AUTH_REQUIRED');
  const db = createClient('https://cuxzzpsyufcewtmicszk.supabase.co', key,
    { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: builds, error } = await db.from('ultimate_course_builds')
    .select('id,course_id,status,profile').eq('status', 'built');
  if (error) throw error;
  const { data: activeJobs, error: jobError } = await db.from('ultimate_build_jobs')
    .select('build_id').eq('status', 'running');
  if (jobError) throw jobError;
  const active = new Set((activeJobs ?? []).map(job => job.build_id));
  const release = new UltimateReleaseService(db);
  const results = await publishApprovedCourses({
    builds: (builds ?? []).map(build => ({ ...build, activeJob: active.has(build.id) })),
    publish: (id: string, actor: string) => release.publish(id, actor),
    verify: async (build: any) => {
      const [course, version] = await Promise.all([
        db.from('courses').select('status,is_active,total_lessons').eq('id', build.course_id).single(),
        db.from('ultimate_release_versions').select('id').eq('build_id', build.id).eq('status', 'released').maybeSingle(),
      ]);
      if (course.error || version.error) throw course.error ?? version.error;
      return course.data?.status === 'published' && course.data.is_active === true &&
        course.data.total_lessons === build.profile.competencies.length && Boolean(version.data);
    },
    acknowledge: async (build: any) => {
      // The release is durable before clearing the owner-review queue wait.
      const b = await db.from('ultimate_course_builds').update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', build.id).eq('status', 'built');
      if (b.error) throw b.error;
      const j = await db.from('ultimate_build_jobs').update({ status: 'completed', last_error: null, updated_at: new Date().toISOString() })
        .eq('build_id', build.id).eq('status', 'failed').eq('last_error', 'OWNER_COURSE_REVIEW_REQUIRED');
      if (j.error) throw j.error;
    },
  });
  console.log(JSON.stringify({ publications: results }));
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'COURSE_PUBLICATION_FAILED'); process.exitCode = 1; });
