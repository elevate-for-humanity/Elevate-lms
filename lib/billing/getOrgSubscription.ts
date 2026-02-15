import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

export interface OrgSubscription {
  id: string;
  organization_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan: string;
  status: string;
  seats: number | null;
  current_period_end: string | null;
  grace_until: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get organization subscription
 * Cached for performance
 */
export const getOrgSubscription = cache(
  async (
    supabase: SupabaseClient,
    organizationId: string
  ): Promise<OrgSubscription | null> => {
    const { data, error }: any = await supabase
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      // No subscription is valid state
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get subscription`);
    }

    return data;
  }
);
