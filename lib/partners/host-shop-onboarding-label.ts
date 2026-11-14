/** Explain current evidence without treating a saved workflow step as missing evidence. */
export function hostShopOnboardingLabel(
  partner: { onboarding_completed?: boolean | null; onboarding_step?: string | null; mou_signed?: boolean | null },
  requiredCount: number,
  outstandingCount: number,
): string {
  if (partner.onboarding_completed === true) return 'Complete';
  if (!requiredCount) return 'Incomplete — document requirements not configured';
  if (outstandingCount > 0) return 'Incomplete — documents need review';
  if (partner.mou_signed !== true) return 'Incomplete — MOU signature';
  const step = partner.onboarding_step?.trim();
  if (!step || step.toLowerCase() === 'documents') return 'Incomplete — onboarding confirmation';
  return `Incomplete — ${step.replace(/_/g, ' ')}`;
}
