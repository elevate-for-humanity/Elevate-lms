import { handleLearnerOnboardingStep } from '@/lib/onboarding/complete-step-handler';

// Canonical Marketing-side learner onboarding endpoint. This is intentionally
// the same handler used by LMS so orientation/doc/agreement state cannot drift.
export const POST = handleLearnerOnboardingStep;
