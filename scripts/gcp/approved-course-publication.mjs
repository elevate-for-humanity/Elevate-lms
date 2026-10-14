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
