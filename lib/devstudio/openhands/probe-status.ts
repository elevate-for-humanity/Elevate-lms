/**
 * OpenHands probe → platform_secrets test_status mapping — pure helper for
 * PR3 (#2524). The probe in lib/devstudio/paris-openhands-readiness.ts
 * already verifies the key live, but nothing recorded the outcome, so
 * platform_secrets.OPENHANDS_API_KEY kept test_status/last_tested null.
 * Only 'verified' maps to 'ok'; every unverified outcome maps to 'error'
 * (never 'set'), so a stale key cannot look healthy.
 *
 * Dependency-free on purpose: unit-tested without any credential or network.
 */
export function openHandsProbeTestStatus(probe: {
  verified: boolean;
  status?: string;
}): 'ok' | 'error' {
  return probe.verified ? 'ok' : 'error';
}
