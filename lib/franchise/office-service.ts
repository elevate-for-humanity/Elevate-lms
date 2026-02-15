/**
 * Tax Office Service
 * Database operations for franchise office management
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TaxOffice, CreateOfficeInput, OfficeStats } from './types';

function getServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export class OfficeService {
  private get supabase() {
    return getServiceClient();
  }

  /**
   * Create a new tax office
   */
  async createOffice(input: CreateOfficeInput, createdBy: string): Promise<TaxOffice> {
    const { data, error } = await this.supabase
      .from('franchise_offices')
      .insert({
        office_code: input.office_code,
        office_name: input.office_name,
        owner_name: input.owner_name,
        owner_email: input.owner_email,
        owner_phone: input.owner_phone,
        address_street: input.address_street,
        address_city: input.address_city,
        address_state: input.address_state,
        address_zip: input.address_zip,
        business_ein: input.business_ein,
        state_license: input.state_license,
        parent_efin: '358459', // Your EFIN
        status: 'pending',
        franchise_fee: input.franchise_fee || 0,
        per_return_fee: input.per_return_fee || 5.00,
        revenue_share_percent: input.revenue_share_percent || 0,
        contract_start_date: input.contract_start_date,
        contract_end_date: input.contract_end_date,
        max_preparers: input.max_preparers || 10,
        max_returns_per_season: input.max_returns_per_season,
        created_by: createdBy,
        notes: input.notes
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create office`);
    
    // Log audit event
    await this.logAudit('office_created', 'franchise_office', data.id, null, data);
    
    return data as TaxOffice;
  }

  /**
   * Get office by ID
   */
  async getOffice(officeId: string): Promise<TaxOffice | null> {
    const { data, error } = await this.supabase
      .from('franchise_offices')
      .select('*')
      .eq('id', officeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get office`);
    }
    
    return data as TaxOffice;
  }

  /**
   * Get office by code
   */
  async getOfficeByCode(officeCode: string): Promise<TaxOffice | null> {
    const { data, error } = await this.supabase
      .from('franchise_offices')
      .select('*')
      .eq('office_code', officeCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get office`);
    }
    
    return data as TaxOffice;
  }

  /**
   * List all offices
   */
  async listOffices(filters?: {
    status?: string;
    ownerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ offices: TaxOffice[]; total: number }> {
    let query = this.supabase
      .from('franchise_offices')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.ownerId) {
      query = query.eq('owner_id', filters.ownerId);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to list offices`);
    
    return {
      offices: data as TaxOffice[],
      total: count || 0
    };
  }

  /**
   * Update office
   */
  async updateOffice(officeId: string, updates: Partial<TaxOffice>): Promise<TaxOffice> {
    // Get current state for audit
    const current = await this.getOffice(officeId);
    
    const { data, error } = await this.supabase
      .from('franchise_offices')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', officeId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update office`);
    
    // Log audit event
    await this.logAudit('office_updated', 'franchise_office', officeId, current, data);
    
    return data as TaxOffice;
  }

  /**
   * Activate office
   */
  async activateOffice(officeId: string): Promise<TaxOffice> {
    return this.updateOffice(officeId, {
      status: 'active',
      activated_at: new Date().toISOString()
    });
  }

  /**
   * Suspend office
   */
  async suspendOffice(officeId: string, reason: string): Promise<TaxOffice> {
    return this.updateOffice(officeId, {
      status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspension_reason: reason
    });
  }

  /**
   * Deactivate/terminate office
   */
  async deactivateOffice(officeId: string, actorId: string): Promise<TaxOffice> {
    const office = await this.updateOffice(officeId, {
      status: 'terminated'
    });
    
    await this.logAudit('office_terminated', 'franchise_office', officeId, null, { terminated_by: actorId });
    
    return office;
  }

  /**
   * Terminate office
   */
  async terminateOffice(officeId: string, reason: string): Promise<TaxOffice> {
    return this.updateOffice(officeId, {
      status: 'terminated',
      suspended_at: new Date().toISOString(),
      suspension_reason: reason
    });
  }

  /**
   * Get office statistics
   */
  async getOfficeStats(officeId: string, seasonYear?: number): Promise<OfficeStats> {
    const year = seasonYear || new Date().getFullYear();
    const seasonStart = `${year}-01-01`;
    const seasonEnd = `${year}-12-31`;

    // Get returns count and revenue
    const { data: submissions, error } = await this.supabase
      .from('franchise_return_submissions')
      .select('id, client_fee, preparer_id, status')
      .eq('office_id', officeId)
      .gte('created_at', seasonStart)
      .lte('created_at', seasonEnd);

    if (error) throw new Error(`Failed to get office stats`);

    const returns = submissions || [];
    const acceptedReturns = returns.filter(r => r.status === 'accepted');
    const rejectedReturns = returns.filter(r => r.status === 'rejected');
    
    const totalRevenue = returns.reduce((sum, r) => sum + (r.client_fee || 0), 0);
    const avgFee = returns.length > 0 ? totalRevenue / returns.length : 0;
    const rejectionRate = returns.length > 0 ? (rejectedReturns.length / returns.length) * 100 : 0;

    // Find top preparer
    const preparerCounts: Record<string, number> = {};
    returns.forEach(r => {
      if (r.preparer_id) {
        preparerCounts[r.preparer_id] = (preparerCounts[r.preparer_id] || 0) + 1;
      }
    });

    let topPreparerId: string | null = null;
    let topCount = 0;
    Object.entries(preparerCounts).forEach(([id, count]) => {
      if (count > topCount) {
        topPreparerId = id;
        topCount = count;
      }
    });

    let topPreparerName: string | null = null;
    if (topPreparerId) {
      const { data: preparer } = await this.supabase
        .from('franchise_preparers')
        .select('first_name, last_name')
        .eq('id', topPreparerId)
        .single();
      
      if (preparer) {
        topPreparerName = `${preparer.first_name} ${preparer.last_name}`;
      }
    }

    return {
      office_id: officeId,
      returns_count: returns.length,
      revenue: totalRevenue,
      average_fee: avgFee,
      rejection_rate: rejectionRate,
      top_preparer_id: topPreparerId,
      top_preparer_name: topPreparerName
    };
  }

  /**
   * Assign owner user account to office
   */
  async assignOwner(officeId: string, userId: string): Promise<TaxOffice> {
    return this.updateOffice(officeId, {
      owner_id: userId
    } as Partial<TaxOffice>);
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

export const officeService = new OfficeService();
