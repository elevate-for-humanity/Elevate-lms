import type { SupabaseClient } from '@supabase/supabase-js';
import type { UltimateCredentialPort } from '../core/ports';
export class UltimatePlatformCredential implements UltimateCredentialPort {
  constructor(private db: SupabaseClient) {}
  async load(profileId: string) {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      profileId,
    );
    const escaped = profileId.replace(/[\\",()]/g, '');
    const filters = [`abbreviation.eq.${escaped}`, `name.eq.${escaped}`];
    if (uuid) filters.unshift(`id.eq.${profileId}`);
    const { data, error } = await this.db
      .from('credential_registry')
      .select('*')
      .or(filters.join(','))
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ?? { id: profileId, status: 'profile-provided-by-build' };
  }
}
