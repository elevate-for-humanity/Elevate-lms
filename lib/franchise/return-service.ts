/**
 * Tax Return Service
 * Handles return creation with preparer assignment and ERO signature
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { TaxReturn } from '../tax-software/types';
import { createMeFSubmission } from '../tax-software/mef/xml-generator';
import { validateTaxReturn } from '../tax-software/validation/irs-rules';
import { preparerService } from './preparer-service';
import { clientService } from './client-service';
import { officeService } from './office-service';

function getServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface CreateReturnInput {
  office_id: string;
  preparer_id: string;
  client_id: string;
  tax_return: TaxReturn;
  client_fee: number;
}

export interface ReturnWithAssignment {
  id: string;
  submission_id: string;
  office_id: string;
  preparer_id: string;
  preparer_ptin: string;
  ero_id: string;
  client_id: string;
  client_fee: number;
  franchise_fee: number;
  preparer_commission: number;
  office_revenue: number;
  status: string;
  created_at: string;
}

export class ReturnService {
  private get supabase() {
    return getServiceClient();
  }

  /**
   * Create and submit a tax return with full preparer/office tracking
   */
  async createReturn(input: CreateReturnInput): Promise<ReturnWithAssignment> {
    // Validate preparer
    const preparer = await preparerService.getPreparer(input.preparer_id);
    if (!preparer) {
      throw new Error('Preparer not found');
    }
    if (preparer.status !== 'active') {
      throw new Error('Preparer is not active');
    }
    if (!preparer.efin_authorized) {
      throw new Error('Preparer is not authorized to use EFIN');
    }
    if (preparer.office_id !== input.office_id) {
      throw new Error('Preparer does not belong to this office');
    }

    // Validate office
    const office = await officeService.getOffice(input.office_id);
    if (!office) {
      throw new Error('Office not found');
    }
    if (office.status !== 'active') {
      throw new Error('Office is not active');
    }

    // Get ERO (office owner or designated ERO)
    const ero = await this.getOfficeERO(input.office_id);
    if (!ero) {
      throw new Error('No ERO found for office');
    }

    // Validate tax return
    const validation = validateTaxReturn(input.tax_return);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.errorMessage).join(', ')}`);
    }

    // Add preparer info to return
    const returnWithPreparer: TaxReturn = {
      ...input.tax_return,
      efin: office.parent_efin,
      preparer: {
        ptin: preparer.ptin,
        firstName: preparer.first_name,
        lastName: preparer.last_name,
        firmName: office.office_name,
        firmEIN: office.business_ein || undefined,
        firmAddress: {
          street: office.address_street,
          city: office.address_city,
          state: office.address_state,
          zip: office.address_zip
        },
        selfEmployed: false
      }
    };

    // Generate XML
    const softwareId = process.env.IRS_SOFTWARE_ID || 'ELEVATE001';
    const submission = createMeFSubmission(returnWithPreparer, softwareId);

    // Calculate fees
    const franchiseFee = office.per_return_fee || 5.00;
    const preparerCommission = this.calculatePreparerCommission(preparer, input.client_fee);
    const officeRevenue = input.client_fee - franchiseFee - preparerCommission;

    // Store submission
    const { data, error } = await this.supabase
      .from('franchise_return_submissions')
      .insert({
        submission_id: submission.submissionId,
        efin: office.parent_efin,
        software_id: softwareId,
        tax_year: input.tax_return.taxYear,
        submission_type: 'IRS1040',
        xml_content: submission.xmlContent,
        status: 'pending',
        
        // Office/preparer tracking
        office_id: input.office_id,
        preparer_id: input.preparer_id,
        preparer_ptin: preparer.ptin,
        ero_id: ero.id,
        
        // Fee tracking
        client_fee: input.client_fee,
        franchise_fee: franchiseFee,
        preparer_commission: preparerCommission,
        office_revenue: officeRevenue,
        
        // Client reference
        taxpayer_ssn_hash: this.hashSSN(input.tax_return.taxpayer.ssn),
        return_data: {
          client_id: input.client_id,
          filing_status: input.tax_return.filingStatus,
          total_income: input.tax_return.totalIncome,
          refund_amount: input.tax_return.refundAmount,
          amount_owed: input.tax_return.amountOwed
        }
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create submission`);
    }

    // Update preparer stats
    await preparerService.incrementReturnCount(input.preparer_id);

    // Update client record
    await clientService.recordReturnFiled(input.client_id, data.id, input.client_fee);

    // Log audit
    await this.logAudit('return_created', 'mef_submission', data.id, null, {
      submission_id: submission.submissionId,
      office_id: input.office_id,
      preparer_id: input.preparer_id,
      client_fee: input.client_fee
    });

    return {
      id: data.id,
      submission_id: submission.submissionId,
      office_id: input.office_id,
      preparer_id: input.preparer_id,
      preparer_ptin: preparer.ptin,
      ero_id: ero.id,
      client_id: input.client_id,
      client_fee: input.client_fee,
      franchise_fee: franchiseFee,
      preparer_commission: preparerCommission,
      office_revenue: officeRevenue,
      status: 'pending',
      created_at: data.created_at
    };
  }

  /**
   * Get office ERO (Electronic Return Originator)
   */
  private async getOfficeERO(officeId: string): Promise<{ id: string; ptin: string } | null> {
    // First try to find designated ERO
    const { data: ero } = await this.supabase
      .from('franchise_preparers')
      .select('id, ptin')
      .eq('office_id', officeId)
      .eq('ero_authorized', true)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (ero) return ero;

    // Fall back to office owner if they're a preparer
    const office = await officeService.getOffice(officeId);
    if (office?.owner_id) {
      const { data: ownerPreparer } = await this.supabase
        .from('franchise_preparers')
        .select('id, ptin')
        .eq('user_id', office.owner_id)
        .eq('status', 'active')
        .single();

      if (ownerPreparer) return ownerPreparer;
    }

    return null;
  }

  /**
   * Calculate preparer commission based on their compensation type
   */
  private calculatePreparerCommission(preparer: { 
    compensation_type: string;
    per_return_rate: number | null;
    commission_percent: number | null;
  }, clientFee: number): number {
    switch (preparer.compensation_type) {
      case 'per_return':
        return preparer.per_return_rate || 0;
      case 'commission':
        return clientFee * ((preparer.commission_percent || 0) / 100);
      default:
        return 0; // Hourly/salary handled separately
    }
  }

  /**
   * Hash SSN for lookup (not encryption)
   */
  private hashSSN(ssn: string): string {
    return crypto.createHash('sha256').update(ssn.replace(/\D/g, '')).digest('hex');
  }

  /**
   * Get returns for an office
   */
  async getOfficeReturns(officeId: string, filters?: {
    status?: string;
    preparerId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ returns: ReturnWithAssignment[]; total: number }> {
    let query = this.supabase
      .from('franchise_return_submissions')
      .select('*', { count: 'exact' })
      .eq('office_id', officeId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.preparerId) {
      query = query.eq('preparer_id', filters.preparerId);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to get returns`);

    return {
      returns: (data || []).map(r => ({
        id: r.id,
        submission_id: r.submission_id,
        office_id: r.office_id,
        preparer_id: r.preparer_id,
        preparer_ptin: r.preparer_ptin,
        ero_id: r.ero_id,
        client_id: r.return_data?.client_id,
        client_fee: r.client_fee,
        franchise_fee: r.franchise_fee,
        preparer_commission: r.preparer_commission,
        office_revenue: r.office_revenue,
        status: r.status,
        created_at: r.created_at
      })),
      total: count || 0
    };
  }

  /**
   * Get returns for a preparer
   */
  async getPreparerReturns(preparerId: string, filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ returns: ReturnWithAssignment[]; total: number }> {
    let query = this.supabase
      .from('franchise_return_submissions')
      .select('*', { count: 'exact' })
      .eq('preparer_id', preparerId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to get returns`);

    return {
      returns: (data || []).map(r => ({
        id: r.id,
        submission_id: r.submission_id,
        office_id: r.office_id,
        preparer_id: r.preparer_id,
        preparer_ptin: r.preparer_ptin,
        ero_id: r.ero_id,
        client_id: r.return_data?.client_id,
        client_fee: r.client_fee,
        franchise_fee: r.franchise_fee,
        preparer_commission: r.preparer_commission,
        office_revenue: r.office_revenue,
        status: r.status,
        created_at: r.created_at
      })),
      total: count || 0
    };
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
    });
  }
}

export const returnService = new ReturnService();
