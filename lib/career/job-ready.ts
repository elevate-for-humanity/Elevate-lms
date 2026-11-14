/** Existing EmployIndy SCORM 2004 packages. Facilitation resources are staff-only. */
export const JOB_READY_MODULES = [
  {
    slug: 'introduction',
    id: 'b73c9f10-a048-4600-8e93-000000000000',
    title: 'Introduction to Job Ready Indy',
    description: 'Get familiar with the program and your next steps.',
  },
  {
    slug: 'mindsets',
    id: 'b73c9f10-a048-4600-8e93-000000000001',
    title: 'Mindsets',
    description: 'Build confidence and a growth mindset.',
  },
  {
    slug: 'self-management',
    id: 'b73c9f10-a048-4600-8e93-000000000002',
    title: 'Self-Management',
    description: 'Practice organization and time management.',
  },
  {
    slug: 'learning-strategies',
    id: 'b73c9f10-a048-4600-8e93-000000000003',
    title: 'Learning Strategies',
    description: 'Learn how to develop new skills at work.',
  },
  {
    slug: 'social-skills',
    id: 'b73c9f10-a048-4600-8e93-000000000004',
    title: 'Social Skills',
    description: 'Strengthen communication and teamwork.',
  },
  {
    slug: 'workplace-skills',
    id: 'b73c9f10-a048-4600-8e93-000000000005',
    title: 'Workplace Skills',
    description: 'Prepare for professional expectations on the job.',
  },
  {
    slug: 'launch-a-career',
    id: 'b73c9f10-a048-4600-8e93-000000000006',
    title: 'Launch a Career',
    description: 'Put your job search and career plan into action.',
  },
] as const;

export function jobReadyModule(slug: string) {
  return JOB_READY_MODULES.find((module) => module.slug === slug);
}

export function jobReadyStatus(cmi: Record<string, string>) {
  // Success and completion are different SCORM 2004 fields. Failed attempts
  // may complete the content but must not be displayed as an earned badge.
  if (cmi['cmi.success_status'] === 'failed') return 'failed';
  if (cmi['cmi.completion_status'] === 'completed') return 'completed';
  return 'in_progress';
}

export function jobReadyProgress(cmi: Record<string, string>) {
  if (jobReadyStatus(cmi) === 'completed') return 100;
  const progress = Number(cmi['cmi.progress_measure']);
  return Number.isFinite(progress) ? Math.max(0, Math.min(100, progress * 100)) : 0;
}

/** SCORM 2004 timeinterval: days, hours, minutes and fractional seconds. */
export function scormSeconds(value: string | undefined) {
  const match =
    /^(?:P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?)$/.exec(
      value ?? '',
    );
  if (!match) return 0;
  return (
    Number(match[1] || 0) * 86400 +
    Number(match[2] || 0) * 3600 +
    Number(match[3] || 0) * 60 +
    Number(match[4] || 0)
  );
}
