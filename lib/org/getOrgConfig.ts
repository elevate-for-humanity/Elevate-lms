import { cache } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

export interface OrgConfig {
  features?: {
    lms?: boolean;
    micro_courses?: boolean;
    apprenticeships?: boolean;
    employer_portal?: boolean;
    workforce_reporting?: boolean;
    ai_autopilots?: boolean;
  };
  funding?: {
    wioa?: boolean;
    wrg?: boolean;
    jri?: boolean;
    employer_paid?: boolean;
    self_pay?: boolean;
  };
  delivery?: {
    online?: boolean;
    in_person?: boolean;
    hybrid?: boolean;
  };
  reporting?: {
    attendance?: boolean;
    outcomes?: boolean;
    credentials?: boolean;
    exports_enabled?: boolean;
  };
  branding?: {
    logo_url?: string | null;
    primary_color?: string | null;
    site_name?: string | null;
  };
  limits?: {
    max_programs?: number | null;
    max_students?: number | null;
    max_staff?: number | null;
  };
}

export const getOrgConfig = cache(
  async (
    supabase: SupabaseClient,
    organizationId: string
  ): Promise<OrgConfig> => {
    const { data, error }: any = await supabase
      .from('organization_settings')
      .select('config')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      throw new Error(`Failed to get org config`);
    }

    return (data?.config as OrgConfig) ?? {};
  }
);
