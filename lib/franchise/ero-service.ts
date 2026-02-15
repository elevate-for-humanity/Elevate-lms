/**
 * ERO (Electronic Return Originator) Service
 * Handles ERO signature flow where franchise owner signs all returns
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface EROSignature {
  ero_id: string;
  ero_ptin: string;
  ero_name: string;
  efin: string;
  signature_date: string;
  signature_pin: string;
  ip_address?: string;
}

export interface EROConfig {
  id: string;
  office_id: string;
  ero_preparer_id: string;
  efin: string;
  firm_name: string;
  firm_ein?: string;
  firm_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  signature_pin: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEROConfigInput {
  office_id: string;
  ero_preparer_id: string;
  efin: string;
  firm_name: string;
  firm_ein?: string;
  firm_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  signature_pin: string;
}

class EROService {
  private get supabase() {
    return getSupabase();
  }

  /**
   * Get ERO configuration for an office
   */
  async getEROConfig(officeId: string): Promise<EROConfig | null> {
    const { data, error } = await this.supabase
      .from('franchise_ero_configs')
      .select('*')
      .eq('office_id', officeId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get ERO config`);
    }

    return data;
  }

  /**
   * Create or update ERO configuration for an office
   */
  async setEROConfig(input: CreateEROConfigInput, actorId: string): Promise<EROConfig> {
    // Verify the ERO preparer exists and has ERO authorization
    const { data: preparer, error: preparerError } = await this.supabase
      .from('franchise_preparers')
      .select('*')
      .eq('id', input.ero_preparer_id)
      .single();

    if (preparerError || !preparer) {
      throw new Error('ERO preparer not found');
    }

    if (!preparer.is_ero_authorized) {
      throw new Error('Preparer is not authorized as ERO');
    }

    // Deactivate existing config
    await this.supabase
      .from('franchise_ero_configs')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('office_id', input.office_id)
      .eq('is_active', true);

    // Create new config
    const { data, error } = await this.supabase
      .from('franchise_ero_configs')
      .insert({
        ...input,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ERO config`);
    }

    await this.logAudit('ero_config_created', input.office_id, data.id, actorId, input);

    return data;
  }

  /**
   * Generate ERO signature for a return
   * This is the franchise owner's signature that appears on all returns
   */
  async generateEROSignature(
    officeId: string,
    ipAddress?: string
  ): Promise<EROSignature> {
    // Get ERO config for office
    const config = await this.getEROConfig(officeId);
    
    if (!config) {
      // Fall back to office owner as ERO
      const { data: office, error: officeError } = await this.supabase
        .from('franchise_offices')
        .select(`
          *,
          owner:franchise_preparers!franchise_offices_owner_id_fkey(*)
        `)
        .eq('id', officeId)
        .single();

      if (officeError || !office) {
        throw new Error('Office not found');
      }

      // If no designated ERO, use office owner
      const owner = office.owner;
      if (!owner) {
        throw new Error('Office has no owner configured as ERO');
      }

      return {
        ero_id: owner.id,
        ero_ptin: owner.ptin,
        ero_name: `${owner.first_name} ${owner.last_name}`,
        efin: office.efin || '',
        signature_date: new Date().toISOString().split('T')[0],
        signature_pin: owner.signature_pin || this.generatePin(),
        ip_address: ipAddress
      };
    }

    // Get ERO preparer details
    const { data: eroPreparer, error: eroError } = await this.supabase
      .from('franchise_preparers')
      .select('*')
      .eq('id', config.ero_preparer_id)
      .single();

    if (eroError || !eroPreparer) {
      throw new Error('ERO preparer not found');
    }

    return {
      ero_id: eroPreparer.id,
      ero_ptin: eroPreparer.ptin,
      ero_name: `${eroPreparer.first_name} ${eroPreparer.last_name}`,
      efin: config.efin,
      signature_date: new Date().toISOString().split('T')[0],
      signature_pin: config.signature_pin,
      ip_address: ipAddress
    };
  }

  /**
   * Validate ERO can sign returns
   */
  async validateERO(officeId: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const config = await this.getEROConfig(officeId);

    if (!config) {
      // Check office owner as fallback
      const { data: office } = await this.supabase
        .from('franchise_offices')
        .select('owner_id, efin')
        .eq('id', officeId)
        .single();

      if (!office?.owner_id) {
        errors.push('No ERO configured and no office owner set');
        return { valid: false, errors };
      }

      const { data: owner } = await this.supabase
        .from('franchise_preparers')
        .select('*')
        .eq('id', office.owner_id)
        .single();

      if (!owner?.is_ero_authorized) {
        errors.push('Office owner is not ERO authorized');
      }

      if (!office.efin) {
        errors.push('Office has no EFIN configured');
      }

      return { valid: errors.length === 0, errors };
    }

    // Validate ERO preparer
    const { data: eroPreparer } = await this.supabase
      .from('franchise_preparers')
      .select('*')
      .eq('id', config.ero_preparer_id)
      .single();

    if (!eroPreparer) {
      errors.push('ERO preparer not found');
    } else {
      if (eroPreparer.status !== 'active') {
        errors.push('ERO preparer is not active');
      }
      if (!eroPreparer.is_ero_authorized) {
        errors.push('ERO preparer is not ERO authorized');
      }
      if (!eroPreparer.ptin) {
        errors.push('ERO preparer has no PTIN');
      }
    }

    if (!config.efin) {
      errors.push('ERO config has no EFIN');
    }

    if (!config.signature_pin) {
      errors.push('ERO config has no signature PIN');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Record ERO signature on a return
   */
  async recordSignature(
    submissionId: string,
    signature: EROSignature,
    actorId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('franchise_return_submissions')
      .update({
        ero_signature: signature,
        ero_signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) {
      throw new Error(`Failed to record ERO signature`);
    }

    await this.logAudit('ero_signature_recorded', null, submissionId, actorId, {
      ero_id: signature.ero_id,
      signature_date: signature.signature_date
    });
  }

  /**
   * Get all returns pending ERO signature for an office
   */
  async getPendingSignatures(officeId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('franchise_return_submissions')
      .select(`
        *,
        preparer:franchise_preparers(*),
        client:franchise_clients(*)
      `)
      .eq('office_id', officeId)
      .is('ero_signed_at', null)
      .eq('status', 'pending_ero')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get pending signatures`);
    }

    return data || [];
  }

  /**
   * Batch sign multiple returns
   */
  async batchSign(
    submissionIds: string[],
    officeId: string,
    ipAddress: string | undefined,
    actorId: string
  ): Promise<{ signed: string[]; failed: { id: string; error: string }[] }> {
    const signature = await this.generateEROSignature(officeId, ipAddress);
    const signed: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of submissionIds) {
      try {
        await this.recordSignature(id, signature, actorId);
        
        // Update status to ready for submission
        await this.supabase
          .from('franchise_return_submissions')
          .update({
            status: 'ready_to_submit',
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        signed.push(id);
      } catch (error) {
        failed.push({
          id,
          error: 'Operation failed'
        });
      }
    }

    return { signed, failed };
  }

  /**
   * Generate a random 5-digit PIN
   */
  private generatePin(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  /**
   * Log audit trail
   */
  private async logAudit(
    action: string,
    officeId: string | null,
    entityId: string,
    actorId: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await this.supabase.from('franchise_audit_log').insert({
      action,
      entity_type: 'ero',
      entity_id: entityId,
      office_id: officeId,
      actor_id: actorId,
      details,
      created_at: new Date().toISOString()
    });
  }
}

export const eroService = new EROService();
