import { getCourseMediaState } from '../../lib/course-factory/media-manager';

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
  const state = await getCourseMediaState(courseId, { verifyUrls: true });
  console.log(JSON.stringify(state, null, 2));
  if (!state.completePackage) {
    throw new Error(
      `Course media is incomplete: expected=${state.expectedTotal}, complete=${state.complete}, playable=${state.playable}, queued=${state.queued}, rendering=${state.rendering}, failed=${state.failed}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exit(1);
});
