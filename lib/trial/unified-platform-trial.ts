/**
 * Canonical platform/workspace trial — single write path.
 *
 * All full-platform trials MUST flow through here:
 * - POST /api/workspaces/create
 * - POST /api/onboarding/launch
 * - POST /api/trial/start-managed (legacy alias)
 *
 * Per-app SKUs (website-builder, sam-gov, grants) use lib/trial/start-app-trial.ts.
 */

import 'server-only';

export { TRIAL_DURATION_DAYS } from '@/lib/workspace/tier-limits';
export {
  startWorkspaceTrial,
  type StartWorkspaceTrialInput,
  type StartWorkspaceTrialResult,
} from '@/lib/workspace/start-workspace-trial';

export type UnifiedPlatformTrialInput = {
  organizationName: string;
  ownerEmail: string;
  ownerName?: string;
  industry?: string;
  plan?: string;
  businessDescription?: string;
};
