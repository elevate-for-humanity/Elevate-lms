/**
 * Tax Preparer Service
 * Database operations for preparer management with PTIN tracking
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TaxPreparer, CreatePreparerInput, PreparerStats } from './types';

function getServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export class PreparerService {
  private get supabase() {
    return getServiceClient();
  }

  /**
   * Create a new tax preparer
   */
  async createPreparer(input: CreatePreparerInput, createdBy: string): Promise<TaxPreparer> {
    // Validate PTIN format (P followed by 8 digits)
    if (!this.validatePTIN(input.ptin)) {
      throw new Error('Invalid PTIN format. Must be P followed by 8 digits (e.g., P01234567)');
    }

    // Check if PTIN already exists
    const existing = await this.getPreparerByPTIN(input.ptin);
    if (existing) {
      throw new Error(`PTIN ${input.ptin} is already registered to another preparer`);
    }

    // Check office preparer limit
    const office = await this.supabase
      .from('franchise_offices')
      .select('max_preparers')
      .eq('id', input.office_id)
      .single();

    if (office.data) {
      const { count } = await this.supabase
        .from('franchise_preparers')
        .select('id', { count: 'exact' })
        .eq('office_id', input.office_id)
        .neq('status', 'terminated');

      if (count && count >= office.data.max_preparers) {
        throw new Error(`Office has reached maximum preparer limit (${office.data.max_preparers})`);
      }
    }

    const { data, error } = await this.supabase
      .from('franchise_preparers')
      .insert({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone,
        ptin: input.ptin.toUpperCase(),
        ptin_expiration: input.ptin_expiration,
        office_id: input.office_id,
        certification_level: input.certification_level,
        certifications: [],
        efin_authorized: input.efin_authorized || false,
        ero_authorized: input.ero_authorized || false,
        status: 'pending',
        compensation_type: input.compensation_type || 'per_return',
        per_return_rate: input.per_return_rate,
        hourly_rate: input.hourly_rate,
        commission_percent: input.commission_percent,
        created_by: createdBy,
        notes: input.notes
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create preparer`);
    
    await this.logAudit('preparer_created', 'franchise_preparer', data.id, null, data);
    
    return data as TaxPreparer;
  }

  /**
   * Validate PTIN format
   */
  validatePTIN(ptin: string): boolean {
    return /^P\d{8}$/i.test(ptin);
  }

  /**
   * Get preparer by ID
   */
  async getPreparer(preparerId: string): Promise<TaxPreparer | null> {
    const { data, error } = await this.supabase
      .from('franchise_preparers')
      .select('*')
      .eq('id', preparerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get preparer`);
    }
    
    return data as TaxPreparer;
  }

  /**
   * Get preparer by PTIN
   */
  async getPreparerByPTIN(ptin: string): Promise<TaxPreparer | null> {
    const { data, error } = await this.supabase
      .from('franchise_preparers')
      .select('*')
      .eq('ptin', ptin.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get preparer`);
    }
    
    return data as TaxPreparer;
  }

  /**
   * Get preparer by user ID
   */
  async getPreparerByUserId(userId: string): Promise<TaxPreparer | null> {
    const { data, error } = await this.supabase
      .from('franchise_preparers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get preparer`);
    }
    
    return data as TaxPreparer;
  }

  /**
   * List preparers for an office
   */
  async listPreparersByOffice(officeId: string, filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ preparers: TaxPreparer[]; total: number }> {
    let query = this.supabase
      .from('franchise_preparers')
      .select('*', { count: 'exact' })
      .eq('office_id', officeId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('last_name', { ascending: true });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to list preparers`);
    
    return {
      preparers: data as TaxPreparer[],
      total: count || 0
    };
  }

  /**
   * List all preparers (admin)
   */
  async listAllPreparers(filters?: {
    status?: string;
    officeId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ preparers: TaxPreparer[]; total: number }> {
    let query = this.supabase
      .from('franchise_preparers')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.officeId) {
      query = query.eq('office_id', filters.officeId);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to list preparers`);
    
    return {
      preparers: data as TaxPreparer[],
      total: count || 0
    };
  }

  /**
   * Update preparer
   */
  async updatePreparer(preparerId: string, updates: Partial<TaxPreparer>): Promise<TaxPreparer> {
    const current = await this.getPreparer(preparerId);
    
    // If updating PTIN, validate and check uniqueness
    if (updates.ptin && updates.ptin !== current?.ptin) {
      if (!this.validatePTIN(updates.ptin)) {
        throw new Error('Invalid PTIN format');
      }
      const existing = await this.getPreparerByPTIN(updates.ptin);
      if (existing && existing.id !== preparerId) {
        throw new Error(`PTIN ${updates.ptin} is already registered`);
      }
      updates.ptin = updates.ptin.toUpperCase();
    }

    const { data, error } = await this.supabase
      .from('franchise_preparers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', preparerId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update preparer`);
    
    await this.logAudit('preparer_updated', 'franchise_preparer', preparerId, current, data);
    
    return data as TaxPreparer;
  }

  /**
   * Activate preparer
   */
  async activatePreparer(preparerId: string): Promise<TaxPreparer> {
    return this.updatePreparer(preparerId, {
      status: 'active',
      activated_at: new Date().toISOString()
    });
  }

  /**
   * Suspend preparer
   */
  async suspendPreparer(preparerId: string, reason: string): Promise<TaxPreparer> {
    return this.updatePreparer(preparerId, {
      status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspension_reason: reason
    });
  }

  /**
   * Deactivate/terminate preparer
   */
  async deactivatePreparer(preparerId: string, actorId: string): Promise<TaxPreparer> {
    const preparer = await this.updatePreparer(preparerId, {
      status: 'terminated'
    });
    
    await this.logAudit('preparer_terminated', 'franchise_preparer', preparerId, null, { terminated_by: actorId });
    
    return preparer;
  }

  /**
   * Link preparer to user account
   */
  async linkUserAccount(preparerId: string, userId: string): Promise<TaxPreparer> {
    return this.updatePreparer(preparerId, {
      user_id: userId
    } as Partial<TaxPreparer>);
  }

  /**
   * Add certification to preparer
   */
  async addCertification(preparerId: string, certification: {
    name: string;
    issued_date: string;
    expiration_date?: string;
    issuer: string;
  }): Promise<TaxPreparer> {
    const preparer = await this.getPreparer(preparerId);
    if (!preparer) throw new Error('Preparer not found');

    const certifications = [...(preparer.certifications || []), certification];
    
    return this.updatePreparer(preparerId, { certifications });
  }

  /**
   * Get preparer statistics
   */
  async getPreparerStats(preparerId: string, seasonYear?: number): Promise<PreparerStats> {
    const year = seasonYear || new Date().getFullYear();
    const seasonStart = `${year}-01-01`;
    const seasonEnd = `${year}-12-31`;

    const { data: submissions, error } = await this.supabase
      .from('franchise_return_submissions')
      .select('id, client_fee, preparer_commission, status')
      .eq('preparer_id', preparerId)
      .gte('created_at', seasonStart)
      .lte('created_at', seasonEnd);

    if (error) throw new Error(`Failed to get preparer stats`);

    const returns = submissions || [];
    const rejectedReturns = returns.filter(r => r.status === 'rejected');
    
    const totalRevenue = returns.reduce((sum, r) => sum + (r.client_fee || 0), 0);
    const totalEarnings = returns.reduce((sum, r) => sum + (r.preparer_commission || 0), 0);
    const avgFee = returns.length > 0 ? totalRevenue / returns.length : 0;
    const rejectionRate = returns.length > 0 ? (rejectedReturns.length / returns.length) * 100 : 0;

    return {
      preparer_id: preparerId,
      returns_count: returns.length,
      revenue_generated: totalRevenue,
      average_fee: avgFee,
      rejection_rate: rejectionRate,
      earnings: totalEarnings
    };
  }

  /**
   * Update preparer return counts
   */
  async incrementReturnCount(preparerId: string): Promise<void> {
    const preparer = await this.getPreparer(preparerId);
    if (!preparer) return;

    await this.supabase
      .from('franchise_preparers')
      .update({
        returns_prepared_lifetime: (preparer.returns_prepared_lifetime || 0) + 1,
        returns_prepared_current_season: (preparer.returns_prepared_current_season || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', preparerId);
  }

  /**
   * Reset season counts (run at start of new season)
   */
  async resetSeasonCounts(): Promise<void> {
    await this.supabase
      .from('franchise_preparers')
      .update({
        returns_prepared_current_season: 0,
        updated_at: new Date().toISOString()
      })
      .neq('status', 'terminated');
  }

  /**
   * Log audit event
   */
  private async logAudit(
    eventType: string,
    entityType: string,
    entityId: string,
    oldValues: unknown,
    newValues: unknown
  ): Promise<void> {
    await this.supabase.from('franchise_audit_log').insert({
      action: eventType,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      created_at: new Date().toISOString()
    });
  }
}

export const preparerService = new PreparerService();
