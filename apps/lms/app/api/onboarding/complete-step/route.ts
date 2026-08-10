import { handleLearnerOnboardingStep } from '@/lib/onboarding/complete-step-handler';

// Auth, rate limiting, live-schema writes, and learner-role enforcement are
// centralized so Marketing and LMS cannot drift into separate onboarding logic.
export const POST = handleLearnerOnboardingStep;
