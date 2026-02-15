import { cache } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

export interface OrgContext {
  organization_id: string;
  role: string;
  organization: {
    name: string;
    slug: string;
    type: string;
    status: string;
  };
}

export const getOrgContext = cache(
  async (supabase: SupabaseClient, userId: string): Promise<OrgContext> => {
    // First get the user's active organization from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.organization_id) {
      throw new Error('User not associated with any organization');
    }

    // Then get their membership and role for that organization
    const { data, error }: any = await supabase
      .from('organization_users')
      .select(
        `
      organization_id,
      role,
      organizations (
        name,
        slug,
        type,
        status
      )
    `
      )
      .eq('user_id', userId)
      .eq('organization_id', profile.organization_id)
      .single();

    if (error) {
      throw new Error(`Failed to get org context`);
    }

    if (!data) {
      throw new Error('User membership not found for active organization');
    }

    return {
      organization_id: data.organization_id,
      role: data.role,
      organization: Array.isArray(data.organizations)
        ? data.organizations[0]
        : data.organizations,
    };
  }
);
