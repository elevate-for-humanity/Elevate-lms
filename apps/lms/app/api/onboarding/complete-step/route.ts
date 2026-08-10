import { apiAuthGuard } from '@/lib/admin/guards';
import { handleLearnerOnboardingStep } from '@/lib/onboarding/complete-step-handler';

export async function POST(request: Request) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  return handleLearnerOnboardingStep(request);
}
