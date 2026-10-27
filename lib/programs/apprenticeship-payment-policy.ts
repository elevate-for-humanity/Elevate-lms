/** Owner policy: apprenticeship tuition uses self-pay enrollment only. */
export function isSelfPayApprenticeship(program: string | null | undefined): boolean {
  return /apprentice/i.test(program || '');
}

export function isSelfPayPaymentMethod(value: string | null | undefined): boolean {
  const method = (value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return ['self_pay', 'selfpay', 'payment_plan', 'bnpl'].includes(method);
}

export function apprenticeshipPaymentError(program: string | null | undefined, method: string | null | undefined): string | null {
  if (!isSelfPayApprenticeship(program) || !method?.trim() || isSelfPayPaymentMethod(method)) return null;
  return 'Apprenticeship enrollment is self-pay only. Choose self-pay and review the published tuition and payment terms.';
}
