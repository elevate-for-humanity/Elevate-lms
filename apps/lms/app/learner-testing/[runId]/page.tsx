import { notFound } from 'next/navigation';
import { loadOwnedLearnerTest } from '@/lib/ultimate-course-builder/testing/test-run-access';
import { publicBlueprint } from '@/lib/ultimate-course-builder/testing/learner-test-policy';
import StagedLessonExperience from '@/components/lms/StagedLessonExperience';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Private lesson acceptance', robots: { index: false, follow: false } };
export default async function StagedLesson({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const access = await loadOwnedLearnerTest(runId);
  if (!access) notFound();
  return <main className="mx-auto max-w-4xl px-4 py-6"><p className="text-sm">Private lesson test · Test progress only</p>
    <h1 className="my-4 text-2xl font-bold">{access.run.snapshot.title}</h1>
    <StagedLessonExperience runId={runId} snapshot={{ ...access.run.snapshot, blueprint: publicBlueprint(access.run.snapshot.blueprint) }} initialProgress={access.run.progress} />
  </main>;
}
