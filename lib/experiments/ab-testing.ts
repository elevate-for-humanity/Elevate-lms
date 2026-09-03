/**
 * A/B Testing Framework
 *
 * Lightweight experimentation system for conversion optimization.
 * Integrates with Google Analytics for tracking.
 */

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: Variant[];
  targetAudience?: AudienceFilter;
  startDate?: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed';
}

export interface Variant {
  id: string;
  name: string;
  weight: number; // 0-100, must sum to 100 across all variants
  isControl?: boolean;
}

export interface AudienceFilter {
  // Percentage of traffic to include (0-100)
  trafficPercentage?: number;
  // Only include users matching these criteria
  userAttributes?: {
    isNewUser?: boolean;
    hasEnrolled?: boolean;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    referrer?: string;
  };
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  assignedAt: number;
}

// Storage key for experiment assignments
const STORAGE_KEY = 'efh_experiments';

/**
 * Get or create a stable user ID for experiment assignment
 */
function getUserId(): string {
  if (typeof window === 'undefined') return '';

  let userId = localStorage.getItem('efh_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('efh_user_id', userId);
  }
  return userId;
}

/**
 * Hash function for consistent assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Get stored experiment assignments
 */
function getStoredAssignments(): Record<string, ExperimentAssignment> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Store experiment assignment
 */
function storeAssignment(assignment: ExperimentAssignment): void {
  if (typeof window === 'undefined') return;

  const assignments = getStoredAssignments();
  assignments[assignment.experimentId] = assignment;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

/**
 * Check if user matches audience filter
 */
function matchesAudience(filter?: AudienceFilter): boolean {
  if (!filter) return true;

  // Traffic percentage check
  if (filter.trafficPercentage !== undefined) {
    const userId = getUserId();
    const hash = hashString(userId) % 100;
    if (hash >= filter.trafficPercentage) return false;
  }

  // User attribute checks would go here
  // (requires integration with user context)

  return true;
}

/**
 * Assign user to a variant
 */
function assignVariant(experiment: Experiment): Variant {
  const userId = getUserId();
  const hash = hashString(`${userId}_${experiment.id}`) % 100;

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (hash < cumulative) {
      return variant;
    }
  }

  // Fallback to first variant
  return experiment.variants[0];
}

/**
 * Get variant for an experiment
 * Returns null if user is not in the experiment
 */
export function getVariant(experiment: Experiment): Variant | null {
  if (typeof window === 'undefined') return null;

  // Check experiment status
  if (experiment.status !== 'running') return null;

  // Check date range
  const now = new Date();
  if (experiment.startDate && now < experiment.startDate) return null;
  if (experiment.endDate && now > experiment.endDate) return null;

  // Check audience filter
  if (!matchesAudience(experiment.targetAudience)) return null;

  // Check for existing assignment
  const assignments = getStoredAssignments();
  const existing = assignments[experiment.id];

  if (existing) {
    const variant = experiment.variants.find((v) => v.id === existing.variantId);
    if (variant) return variant;
  }

  // Assign new variant
  const variant = assignVariant(experiment);

  storeAssignment({
    experimentId: experiment.id,
    variantId: variant.id,
    assignedAt: Date.now(),
  });

  // Track assignment in analytics
  trackExperimentAssignment(experiment.id, variant.id);

  return variant;
}

/**
 * Track experiment assignment in Google Analytics
 */
function trackExperimentAssignment(experimentId: string, variantId: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'experiment_assignment', {
      experiment_id: experimentId,
      variant_id: variantId,
    });
  }
}

/**
 * Track conversion event for an experiment
 */
export function trackConversion(
  experimentId: string,
  conversionType: string,
  value?: number,
): void {
  const assignments = getStoredAssignments();
  const assignment = assignments[experimentId];

  if (!assignment) return;

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'experiment_conversion', {
      experiment_id: experimentId,
      variant_id: assignment.variantId,
      conversion_type: conversionType,
      value: value,
    });
  }
}

/**
 * React hook for A/B testing
 */
export function useExperiment(experiment: Experiment) {
  // Get variant on client side only
  if (typeof window === 'undefined') {
    return {
      variant: experiment.variants.find((v) => v.isControl) || experiment.variants[0],
      isLoading: true,
      trackConversion: () => {},
    };
  }

  const variant = getVariant(experiment);

  return {
    variant: variant || experiment.variants.find((v) => v.isControl) || experiment.variants[0],
    isLoading: false,
    isInExperiment: variant !== null,
    trackConversion: (type: string, value?: number) => trackConversion(experiment.id, type, value),
  };
}

// ============================================
// Pre-defined experiments
// ============================================

export const EXPERIMENTS = {
  // Homepage CTA button color
  homepageCTA: {
    id: 'homepage-cta-color',
    name: 'Homepage CTA Button Color',
    description: 'Test blue vs green CTA button on homepage',
    status: 'running' as const,
    variants: [
      { id: 'control', name: 'Blue (Control)', weight: 50, isControl: true },
      { id: 'green', name: 'Green', weight: 50 },
    ],
  },

  // Application form length
  applicationFormLength: {
    id: 'application-form-length',
    name: 'Application Form Length',
    description: 'Test short vs long application form',
    status: 'running' as const,
    variants: [
      { id: 'control', name: 'Full Form (Control)', weight: 50, isControl: true },
      { id: 'short', name: 'Short Form', weight: 50 },
    ],
  },

  // Social proof placement
  socialProof: {
    id: 'social-proof-placement',
    name: 'Social Proof Placement',
    description: 'Test testimonials above vs below fold',
    status: 'running' as const,
    variants: [
      { id: 'control', name: 'Below Fold (Control)', weight: 50, isControl: true },
      { id: 'above', name: 'Above Fold', weight: 50 },
    ],
  },
} as const;

// Type declarations
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
