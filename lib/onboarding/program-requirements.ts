export type OnboardingRequirement =
  | 'orientation'
  | 'student_handbook'
  | 'enrollment_agreement'
  | 'program_acknowledgment'
  | 'apprenticeship_agreement';

export interface ProgramOnboardingRequirements {
  programSlug: string;
  requirements: OnboardingRequirement[];
}

/**
 * Canonical learner onboarding policy.
 *
 * Every program receives the common learner controls. Apprenticeships add the
 * apprenticeship agreement. Partner/host-shop MOUs are intentionally NOT
 * learner requirements; those are organization-to-organization agreements.
 *
 * This function is deliberately default-safe: a newly added program cannot
 * bypass handbook/orientation/agreement requirements just because nobody added
 * a one-off configuration row.
 */
export function getProgramOnboardingRequirements(
  programSlug: string,
  options: { apprenticeship?: boolean } = {},
): ProgramOnboardingRequirements {
  const requirements: OnboardingRequirement[] = [
    'orientation',
    'student_handbook',
    'enrollment_agreement',
    'program_acknowledgment',
  ];

  if (options.apprenticeship || /apprentice|barber|cosmetology|esthetic|manicur/i.test(programSlug)) {
    requirements.push('apprenticeship_agreement');
  }

  return { programSlug, requirements };
}

export const ONBOARDING_ROUTES: Record<OnboardingRequirement, string> = {
  orientation: '/onboarding/orientation',
  student_handbook: '/onboarding/learner/handbook',
  enrollment_agreement: '/onboarding/enrollment-agreement',
  program_acknowledgment: '/onboarding/learner',
  apprenticeship_agreement: '/onboarding/apprenticeship-agreement',
};

export function hasRequiredOnboardingSteps(
  completed: Iterable<string>,
  requirements: ProgramOnboardingRequirements,
): boolean {
  const done = new Set(completed);
  return requirements.requirements.every((requirement) => done.has(requirement));
}
