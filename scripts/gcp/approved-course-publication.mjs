export function hasReleaseAuthorization(build) {
  const a = build.profile?.releaseAuthorization;
  return a?.mode === 'publish-after-validation' &&
    typeof a.approvedAt === 'string' && Number.isFinite(Date.parse(a.approvedAt)) &&
    typeof a.actorId === 'string' && a.actorId === build.profile?.mediaAcquisitionOwnerId;
}

// Owner authorization permits publication, but never substitutes for the
// complete lesson contract enforced by the canonical release service.
export async function publishApprovedCourses({ builds, publish, verify, acknowledge }) {
  const results = [];
  for (const build of builds) {
    if (build.status !== 'built' || build.activeJob === true || !hasReleaseAuthorization(build)) continue;
    await publish(build.id, build.profile.releaseAuthorization.actorId);
    if (!(await verify(build))) throw new Error('APPROVED_COURSE_PUBLICATION_READBACK_FAILED');
    await acknowledge(build);
    results.push({ title: build.profile.title, status: 'published' });
  }
  return results;
}

export async function startApprovedSuccessors({ builds, dependencyReleased, enqueue }) {
  const results = [];
  for (const build of builds) {
    const dependency = build.profile?.releaseAuthorization?.startAfterCourseId;
    if (build.status !== 'blocked' || !hasReleaseAuthorization(build) || !dependency ||
        build.job?.status !== 'failed' || build.job?.last_error !== 'WAITING_FOR_CORRECTED_COMPLETE_LESSON_WORKER') continue;
    if (!(await dependencyReleased(dependency))) continue;
    await enqueue(build);
    results.push({ title: build.profile.title, status: 'queued' });
  }
  return results;
}
