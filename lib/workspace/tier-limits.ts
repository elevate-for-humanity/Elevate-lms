/**
 * Elevate Dev Cloud workspace subscription tiers.
 */

export type WorkspaceSubscriptionTier = 'builder' | 'pro' | 'agency' | 'starter';

export type WorkspaceTierLimits = {
  maxWorkspaces: number;
  maxDatabaseGb: number;
  customDomains: boolean;
  teamAccess: boolean;
  whiteLabel: boolean;
  aiOperator: boolean;
  aiAutopilot: boolean;
};

export const WORKSPACE_TIER_LIMITS: Record<'builder' | 'pro' | 'agency', WorkspaceTierLimits> = {
  builder: {
    maxWorkspaces: 1,
    maxDatabaseGb: 1,
    customDomains: false,
    teamAccess: false,
    whiteLabel: false,
    aiOperator: false,
    aiAutopilot: false,
  },
  pro: {
    maxWorkspaces: 10,
    maxDatabaseGb: 10,
    customDomains: true,
    teamAccess: true,
    whiteLabel: false,
    aiOperator: true,
    aiAutopilot: false,
  },
  agency: {
    maxWorkspaces: Number.POSITIVE_INFINITY,
    maxDatabaseGb: 50,
    customDomains: true,
    teamAccess: true,
    whiteLabel: true,
    aiOperator: true,
    aiAutopilot: true,
  },
};

export const WORKSPACE_TIER_PRICING_USD_MONTHLY: Record<'builder' | 'pro' | 'agency', number> = {
  builder: 49,
  pro: 149,
  agency: 499,
};

export const TRIAL_DURATION_DAYS = 14;

/** Map API aliases (starter) to canonical tier. */
export function normalizeWorkspaceTier(
  plan: string | undefined | null,
): 'builder' | 'pro' | 'agency' {
  const raw = (plan ?? 'builder').toLowerCase().trim();
  if (raw === 'starter' || raw === 'builder') return 'builder';
  if (raw === 'pro' || raw === 'professional') return 'pro';
  if (raw === 'agency') return 'agency';
  return 'builder';
}

export function getWorkspaceTierLimits(tier: 'builder' | 'pro' | 'agency'): WorkspaceTierLimits {
  return WORKSPACE_TIER_LIMITS[tier];
}
