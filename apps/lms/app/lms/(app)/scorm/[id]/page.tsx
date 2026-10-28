import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { JOB_READY_MODULES } from '@/lib/career/job-ready';

export const dynamic = 'force-dynamic';
export default async function ScormLaunch({ params }: { params: Promise<{ id: string }> }) {
  await requireRole([
    'student',
    'learner',
    'apprentice',
    'barber_apprentice',
    'cosmetology_apprentice',
    'admin',
    'super_admin',
    'staff',
  ]);
  const { id } = await params;
  const lesson = JOB_READY_MODULES.find((lesson) => lesson.id === id);
  if (!lesson) notFound();
  redirect(`/lms/career/job-ready/${lesson.slug}`);
}
