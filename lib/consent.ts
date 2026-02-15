import { logger } from '@/lib/logger';

import { createClient } from '@/lib/supabase/server';

export type ConsentType =
  | 'educational_services'
  | 'ferpa_directory'
  | 'marketing_communications'
  | 'third_party_sharing'
  | 'cookies_analytics'
  | 'parental_consent';

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  granted_at: string | null;
  withdrawn_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  third_party_name: string | null;
  created_at: string;
  updated_at: string;
}

export async function recordConsent(
  userId: string,
  consentType: ConsentType,
  granted: boolean,
  options?: {
    ipAddress?: string;
    userAgent?: string;
    thirdPartyName?: string;
  }
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('record_consent', {
    p_user_id: userId,
    p_consent_type: consentType,
    p_granted: granted,
    p_ip_address: options?.ipAddress || null,
    p_user_agent: options?.userAgent || null,
    p_third_party_name: options?.thirdPartyName || null,
  });

  if (error) {
    logger.error('Error recording consent:', error);
    return null;
  }

  return data;
}

export async function hasConsent(
  userId: string,
  consentType: ConsentType,
  thirdPartyName?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('has_consent', {
    p_user_id: userId,
    p_consent_type: consentType,
    p_third_party_name: thirdPartyName || null,
  });

  if (error) {
    logger.error('Error checking consent:', error);
    return false;
  }

  return data || false;
}

export async function getUserConsents(userId: string): Promise<ConsentRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_consents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching consents:', error);
    return [];
  }

  return data || [];
}

export async function withdrawConsent(
  userId: string,
  consentType: ConsentType,
  thirdPartyName?: string
): Promise<boolean> {
  return recordConsent(userId, consentType, false, { thirdPartyName });
}
