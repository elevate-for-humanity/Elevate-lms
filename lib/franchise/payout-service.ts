/**
 * Preparer Payout Service
 * Manages preparer commission payouts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PreparerPayout } from './types';

function getSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface CreatePayoutInput {
  preparer_id: string;
  office_id: string;
  period_start: string;
  period_end: string;
}

export interface PayoutSummary {
  preparer_id: string;
  preparer_name: string;
  returns_count: number;
  gross_earnings: number;
  pending_payout: number;
  paid_to_date: number;
}

class PayoutService {
  private get supabase() {
    return getSupabase();
  }

  /**
   * Generate payout for a preparer for a given period
   */
  async generatePayout(input: CreatePayoutInput): Promise<PreparerPayout> {
    // Get returns for the period
    const { data: returns, error: returnsError } = await this.supabase
      .from('franchise_return_submissions')
      .select('preparer_commission')
      .eq('preparer_id', input.preparer_id)
      .gte('created_at', input.period_start)
      .lte('created_at', input.period_end + 'T23:59:59')
      .in('status', ['accepted', 'submitted']);

    if (returnsError) {
      throw new Error(`Failed to get returns: ${returnsError.message}`);
    }

    const returnsCount = returns?.length || 0;
    const grossEarnings = returns?.reduce((sum, r) => sum + (r.preparer_commission || 0), 0) || 0;

    // Check for existing payout in this period
    const { data: existing } = await this.supabase
      .from('franchise_preparer_payouts')
      .select('id')
      .eq('preparer_id', input.preparer_id)
      .eq('period_start', input.period_start)
      .eq('period_end', input.period_end)
      .single();

    if (existing) {
      throw new Error('Payout already exists for this period');
    }

    // Create payout record
    const { data, error } = await this.supabase
      .from('franchise_preparer_payouts')
      .insert({
        preparer_id: input.preparer_id,
        office_id: input.office_id,
        period_start: input.period_start,
        period_end: input.period_end,
        returns_count: returnsCount,
        gross_earnings: grossEarnings,
        deductions: 0,
        net_earnings: grossEarnings,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create payout`);
    }

    return data;
  }

  /**
   * Get payout by ID
   */
  async getPayout(payoutId: string): Promise<PreparerPayout | null> {
    const { data, error } = await this.supabase
      .from('franchise_preparer_payouts')
      .select('*')
      .eq('id', payoutId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get payout`);
    }

    return data;
  }

  /**
   * List payouts for an office
   */
  async listPayoutsByOffice(officeId: string, filters?: {
    preparerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payouts: PreparerPayout[]; total: number }> {
    let query = this.supabase
      .from('franchise_preparer_payouts')
      .select('*, preparer:franchise_preparers(first_name, last_name)', { count: 'exact' })
      .eq('office_id', officeId);

    if (filters?.preparerId) {
      query = query.eq('preparer_id', filters.preparerId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('period_end', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list payouts`);
    }

    return {
      payouts: data || [],
      total: count || 0
    };
  }

  /**
   * List payouts for a preparer
   */
  async listPayoutsByPreparer(preparerId: string, filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payouts: PreparerPayout[]; total: number }> {
    let query = this.supabase
      .from('franchise_preparer_payouts')
      .select('*', { count: 'exact' })
      .eq('preparer_id', preparerId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('period_end', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list payouts`);
    }

    return {
      payouts: data || [],
      total: count || 0
    };
  }

  /**
   * Approve a payout
   */
  async approvePayout(payoutId: string, approverId: string): Promise<PreparerPayout> {
    const { data, error } = await this.supabase
      .from('franchise_preparer_payouts')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', payoutId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to approve payout`);
    }

    return data;
  }

  /**
   * Mark payout as paid
   */
  async markPaid(
    payoutId: string, 
    paymentDetails: { method: string; reference: string }
  ): Promise<PreparerPayout> {
    const { data, error } = await this.supabase
      .from('franchise_preparer_payouts')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: paymentDetails.method,
        payment_reference: paymentDetails.reference,
        updated_at: new Date().toISOString()
      })
      .eq('id', payoutId)
      .eq('status', 'approved')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark payout as paid`);
    }

    return data;
  }

  /**
   * Get payout summary for all preparers in an office
   */
  async getOfficeSummary(officeId: string): Promise<PayoutSummary[]> {
    // Get all preparers
    const { data: preparers } = await this.supabase
      .from('franchise_preparers')
      .select('id, first_name, last_name')
      .eq('office_id', officeId);

    if (!preparers) return [];

    const summaries: PayoutSummary[] = [];

    for (const preparer of preparers) {
      // Get returns count and earnings
      const { data: returns } = await this.supabase
        .from('franchise_return_submissions')
        .select('preparer_commission')
        .eq('preparer_id', preparer.id)
        .in('status', ['accepted', 'submitted']);

      const returnsCount = returns?.length || 0;
      const grossEarnings = returns?.reduce((sum, r) => sum + (r.preparer_commission || 0), 0) || 0;

      // Get paid amount
      const { data: paidPayouts } = await this.supabase
        .from('franchise_preparer_payouts')
        .select('net_earnings')
        .eq('preparer_id', preparer.id)
        .eq('status', 'paid');

      const paidToDate = paidPayouts?.reduce((sum, p) => sum + (p.net_earnings || 0), 0) || 0;

      // Get pending amount
      const { data: pendingPayouts } = await this.supabase
        .from('franchise_preparer_payouts')
        .select('net_earnings')
        .eq('preparer_id', preparer.id)
        .in('status', ['pending', 'approved']);

      const pendingPayout = pendingPayouts?.reduce((sum, p) => sum + (p.net_earnings || 0), 0) || 0;

      summaries.push({
        preparer_id: preparer.id,
        preparer_name: `${preparer.first_name} ${preparer.last_name}`,
        returns_count: returnsCount,
        gross_earnings: grossEarnings,
        pending_payout: pendingPayout,
        paid_to_date: paidToDate
      });
    }

    return summaries;
  }

  /**
   * Generate payouts for all preparers in an office for a period
   */
  async generateOfficePayouts(
    officeId: string, 
    periodStart: string, 
    periodEnd: string
  ): Promise<{ generated: PreparerPayout[]; errors: { preparerId: string; error: string }[] }> {
    const { data: preparers } = await this.supabase
      .from('franchise_preparers')
      .select('id')
      .eq('office_id', officeId)
      .eq('status', 'active');

    if (!preparers) return { generated: [], errors: [] };

    const generated: PreparerPayout[] = [];
    const errors: { preparerId: string; error: string }[] = [];

    for (const preparer of preparers) {
      try {
        const payout = await this.generatePayout({
          preparer_id: preparer.id,
          office_id: officeId,
          period_start: periodStart,
          period_end: periodEnd
        });
        generated.push(payout);
      } catch (error) {
        errors.push({
          preparerId: preparer.id,
          error: 'Operation failed'
        });
      }
    }

    return { generated, errors };
  }
}

export const payoutService = new PayoutService();
