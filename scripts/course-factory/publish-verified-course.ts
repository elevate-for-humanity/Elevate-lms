import { publishPersistedCourseWithClient } from '../../lib/course-builder/persisted-publish-service';
import { requireAdminClient } from '../../lib/supabase/admin';

function requiredCourseId(): string {
  const index = process.argv.indexOf('--course-id');
  const value = (index >= 0 ? process.argv[index + 1] : process.env.COURSE_ID)?.trim();
  if (
    !value ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new Error('A valid --course-id UUID is required');
  }
  return value;
}

async function main() {
  const courseId = requiredCourseId();
  const db = await requireAdminClient();
  const result = await publishPersistedCourseWithClient({
    db,
    courseId,
    actorId: null,
    label: 'Automated publication after verified authored-course media',
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok || result.state !== 'published') {
    throw new Error(
      `Verified course publication failed: ${JSON.stringify(result.blocking_issues ?? result)}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exit(1);
});
