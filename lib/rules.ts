import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';

export interface StateRules {
  state: string;
  etpl_required: boolean;
  rapids_required: boolean;
  wioa_allowed: boolean;
  wrg_allowed: boolean;
  ojt_allowed: boolean;
  wotc_allowed: boolean;
  notes?: string;
  updated_at?: string;
}

/**
 * Get state-specific rules for ETPL, WIOA, RAPIDS, etc.
 */
export async function getStateRules(state: string): Promise<StateRules | null> {
  const supabase = createAdminClient();

  const { data, error }: any = await supabase
    .from('state_rules')
    .select('*')
    .eq('state', state.toUpperCase())
    .single();

  if (error) {
    logger.error('Failed to fetch state rules:', error);
    return null;
  }

  return data;
}

/**
 * Validate if a funding source is allowed in a state
 */
export async function validateFundingSource(
  state: string,
  fundingSource: 'WIOA' | 'WRG' | 'OJT' | 'JRI'
): Promise<boolean> {
  const rules = await getStateRules(state);

  if (!rules) {
    // Default to allowing if rules not found
    return true;
  }

  switch (fundingSource) {
    case 'WIOA':
      return rules.wioa_allowed;
    case 'WRG':
      return rules.wrg_allowed;
    case 'OJT':
      return rules.ojt_allowed;
    default:
      return true;
  }
}

/**
 * Check if ETPL is required in a state
 */
export async function isEtplRequired(state: string): Promise<boolean> {
  const rules = await getStateRules(state);
  return rules?.etpl_required ?? true;
}

/**
 * Check if RAPIDS is required in a state
 */
export async function isRapidsRequired(state: string): Promise<boolean> {
  const rules = await getStateRules(state);
  return rules?.rapids_required ?? true;
}

/**
 * Get all state rules
 */
export async function getAllStateRules(): Promise<StateRules[]> {
  const supabase = createAdminClient();

  const { data, error }: any = await supabase
    .from('state_rules')
    .select('*')
    .order('state');

  if (error) {
    logger.error('Failed to fetch all state rules:', error);
    return [];
  }

  return data || [];
}

/**
 * Update state rules
 */
export async function updateStateRules(
  state: string,
  rules: Partial<Omit<StateRules, 'state'>>
): Promise<StateRules | null> {
  const supabase = createAdminClient();

  const { data, error }: any = await supabase
    .from('state_rules')
    .upsert({ state: state.toUpperCase(), ...rules })
    .select()
    .single();

  if (error) {
    logger.error('Failed to update state rules:', error);
    return null;
  }

  return data;
}

/**
 * Initialize default state rules for common states
 */
export async function initializeDefaultStateRules() {
  const defaultRules: StateRules[] = [
    {
      state: 'IN',
      etpl_required: true,
      rapids_required: true,
      wioa_allowed: true,
      wrg_allowed: true,
      ojt_allowed: true,
      wotc_allowed: true,
      notes: 'Indiana - Full support',
    },
    {
      state: 'OH',
      etpl_required: true,
      rapids_required: true,
      wioa_allowed: true,
      wrg_allowed: false,
      ojt_allowed: true,
      wotc_allowed: true,
      notes: 'Ohio - No WRG equivalent',
    },
    {
      state: 'TX',
      etpl_required: true,
      rapids_required: true,
      wioa_allowed: true,
      wrg_allowed: false,
      ojt_allowed: true,
      wotc_allowed: true,
      notes: 'Texas - Skills Development Fund instead of WRG',
    },
  ];

  const supabase = createAdminClient();

  for (const rules of defaultRules) {
    await supabase.from('state_rules').upsert(rules);
  }
}
