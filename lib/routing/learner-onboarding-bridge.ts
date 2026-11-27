const LEARNER_ONBOARDING_STEPS = new Set([
  'agreements', 'complete', 'documents', 'funding', 'handbook',
  'orientation', 'schedule', 'verify-identity',
]);

const ONBOARDING_QUERY_VALUES: Record<string, readonly string[]> = {
  checkout: ['success'],
  reason: ['profile_missing'],
  step: ['verification', 'schedule', 'funding'],
  status: ['submitted'],
  funding: ['pending-review'],
};

/** Legacy LMS entry points hand off only to the existing Marketing checklist. */
export function learnerOnboardingBridge({
  path = [], searchParams = {}, marketingHost, lmsHost,
}: {
  path?: string[];
  searchParams?: Record<string, string | string[] | undefined>;
  marketingHost: string;
  lmsHost: string;
}): { returnPath: string; destination: string } | null {
  if (path.length > 1 || (path.length === 1 && !LEARNER_ONBOARDING_STEPS.has(path[0]))) {
    return null;
  }
  const owner = new URL(marketingHost);
  const lms = new URL(lmsHost);
  if (!['https:', 'http:'].includes(owner.protocol) ||
      !['https:', 'http:'].includes(lms.protocol) ||
      owner.username || owner.password || owner.search || owner.hash || owner.pathname !== '/' ||
      lms.username || lms.password || lms.search || lms.hash || lms.pathname !== '/' ||
      owner.origin === lms.origin) {
    throw new Error('LEARNER_ONBOARDING_ORIGIN_CONFIGURATION_INVALID');
  }
  const destination = new URL('/onboarding/learner' + (path.length ? '/' + path[0] : ''), owner.origin);
  for (const [key, allowed] of Object.entries(ONBOARDING_QUERY_VALUES)) {
    const value = searchParams[key];
    if (typeof value === 'string' && allowed.includes(value)) destination.searchParams.set(key, value);
  }
  return { returnPath: destination.pathname + destination.search, destination: destination.toString() };
}
