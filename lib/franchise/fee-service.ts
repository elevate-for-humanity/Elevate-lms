/**
 * Fee Schedule Service
 * Manages fee schedules for franchise offices
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TaxFeeSchedule } from './types';

function getSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface CreateFeeScheduleInput {
  office_id: string;
  name: string;
  is_default?: boolean;
  base_fee_1040?: number;
  base_fee_1040_ez?: number;
  fee_schedule_a?: number;
  fee_schedule_c?: number;
  fee_schedule_d?: number;
  fee_schedule_e?: number;
  fee_schedule_se?: number;
  fee_per_w2?: number;
  fee_per_1099?: number;
  fee_per_dependent?: number;
  fee_state_return?: number;
  fee_eitc?: number;
  fee_ctc?: number;
  fee_refund_transfer?: number;
  fee_refund_advance?: number;
  returning_client_discount_percent?: number;
  referral_discount?: number;
  senior_discount_percent?: number;
  military_discount_percent?: number;
  effective_from?: string;
  effective_to?: string;
}

export interface FeeCalculation {
  baseFee: number;
  scheduleFees: number;
  formFees: number;
  creditFees: number;
  bankProductFees: number;
  discounts: number;
  totalFee: number;
  breakdown: {
    item: string;
    amount: number;
  }[];
}

class FeeService {
  private get supabase() {
    return getSupabase();
  }

  /**
   * Create a new fee schedule
   */
  async createFeeSchedule(input: CreateFeeScheduleInput): Promise<TaxFeeSchedule> {
    // If setting as default, unset other defaults
    if (input.is_default) {
      await this.supabase
        .from('franchise_fee_schedules')
        .update({ is_default: false })
        .eq('office_id', input.office_id);
    }

    const { data, error } = await this.supabase
      .from('franchise_fee_schedules')
      .insert({
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create fee schedule`);
    }

    return data;
  }

  /**
   * Get fee schedule by ID
   */
  async getFeeSchedule(scheduleId: string): Promise<TaxFeeSchedule | null> {
    const { data, error } = await this.supabase
      .from('franchise_fee_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get fee schedule`);
    }

    return data;
  }

  /**
   * Get default fee schedule for an office
   */
  async getDefaultFeeSchedule(officeId: string): Promise<TaxFeeSchedule | null> {
    const { data, error } = await this.supabase
      .from('franchise_fee_schedules')
      .select('*')
      .eq('office_id', officeId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get default fee schedule`);
    }

    return data;
  }

  /**
   * List fee schedules for an office
   */
  async listFeeSchedules(officeId: string): Promise<TaxFeeSchedule[]> {
    const { data, error } = await this.supabase
      .from('franchise_fee_schedules')
      .select('*')
      .eq('office_id', officeId)
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      throw new Error(`Failed to list fee schedules`);
    }

    return data || [];
  }

  /**
   * Update fee schedule
   */
  async updateFeeSchedule(
    scheduleId: string, 
    updates: Partial<CreateFeeScheduleInput>
  ): Promise<TaxFeeSchedule> {
    // If setting as default, unset other defaults
    if (updates.is_default) {
      const schedule = await this.getFeeSchedule(scheduleId);
      if (schedule) {
        await this.supabase
          .from('franchise_fee_schedules')
          .update({ is_default: false })
          .eq('office_id', schedule.office_id)
          .neq('id', scheduleId);
      }
    }

    const { data, error } = await this.supabase
      .from('franchise_fee_schedules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update fee schedule`);
    }

    return data;
  }

  /**
   * Delete fee schedule
   */
  async deleteFeeSchedule(scheduleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('franchise_fee_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      throw new Error(`Failed to delete fee schedule`);
    }
  }

  /**
   * Calculate fee for a return based on schedule
   */
  calculateFee(
    schedule: TaxFeeSchedule,
    returnDetails: {
      formType: '1040' | '1040-EZ';
      schedules: string[];
      w2Count: number;
      form1099Count: number;
      dependentCount: number;
      hasStateReturn: boolean;
      hasEITC: boolean;
      hasCTC: boolean;
      hasRefundTransfer: boolean;
      hasRefundAdvance: boolean;
      isReturningClient: boolean;
      hasReferral: boolean;
      isSenior: boolean;
      isMilitary: boolean;
    }
  ): FeeCalculation {
    const breakdown: { item: string; amount: number }[] = [];
    
    // Base fee
    const baseFee = returnDetails.formType === '1040' 
      ? schedule.base_fee_1040 
      : schedule.base_fee_1040_ez;
    breakdown.push({ item: `Form ${returnDetails.formType}`, amount: baseFee });

    // Schedule fees
    let scheduleFees = 0;
    const scheduleMap: Record<string, number> = {
      'A': schedule.fee_schedule_a,
      'C': schedule.fee_schedule_c,
      'D': schedule.fee_schedule_d,
      'E': schedule.fee_schedule_e,
      'SE': schedule.fee_schedule_se
    };

    for (const sched of returnDetails.schedules) {
      const fee = scheduleMap[sched] || 0;
      if (fee > 0) {
        scheduleFees += fee;
        breakdown.push({ item: `Schedule ${sched}`, amount: fee });
      }
    }

    // Form fees
    let formFees = 0;
    if (returnDetails.w2Count > 0 && schedule.fee_per_w2 > 0) {
      const w2Fee = returnDetails.w2Count * schedule.fee_per_w2;
      formFees += w2Fee;
      breakdown.push({ item: `W-2 Forms (${returnDetails.w2Count})`, amount: w2Fee });
    }
    if (returnDetails.form1099Count > 0 && schedule.fee_per_1099 > 0) {
      const f1099Fee = returnDetails.form1099Count * schedule.fee_per_1099;
      formFees += f1099Fee;
      breakdown.push({ item: `1099 Forms (${returnDetails.form1099Count})`, amount: f1099Fee });
    }
    if (returnDetails.dependentCount > 0 && schedule.fee_per_dependent > 0) {
      const depFee = returnDetails.dependentCount * schedule.fee_per_dependent;
      formFees += depFee;
      breakdown.push({ item: `Dependents (${returnDetails.dependentCount})`, amount: depFee });
    }
    if (returnDetails.hasStateReturn) {
      formFees += schedule.fee_state_return;
      breakdown.push({ item: 'State Return', amount: schedule.fee_state_return });
    }

    // Credit fees
    let creditFees = 0;
    if (returnDetails.hasEITC) {
      creditFees += schedule.fee_eitc;
      breakdown.push({ item: 'EITC', amount: schedule.fee_eitc });
    }
    if (returnDetails.hasCTC) {
      creditFees += schedule.fee_ctc;
      breakdown.push({ item: 'Child Tax Credit', amount: schedule.fee_ctc });
    }

    // Bank product fees
    let bankProductFees = 0;
    if (returnDetails.hasRefundTransfer) {
      bankProductFees += schedule.fee_refund_transfer;
      breakdown.push({ item: 'Refund Transfer', amount: schedule.fee_refund_transfer });
    }
    if (returnDetails.hasRefundAdvance) {
      bankProductFees += schedule.fee_refund_advance;
      breakdown.push({ item: 'Refund Advance', amount: schedule.fee_refund_advance });
    }

    // Subtotal before discounts
    const subtotal = baseFee + scheduleFees + formFees + creditFees + bankProductFees;

    // Discounts
    let discounts = 0;
    if (returnDetails.isReturningClient && schedule.returning_client_discount_percent > 0) {
      const discount = subtotal * (schedule.returning_client_discount_percent / 100);
      discounts += discount;
      breakdown.push({ item: 'Returning Client Discount', amount: -discount });
    }
    if (returnDetails.hasReferral && schedule.referral_discount > 0) {
      discounts += schedule.referral_discount;
      breakdown.push({ item: 'Referral Discount', amount: -schedule.referral_discount });
    }
    if (returnDetails.isSenior && schedule.senior_discount_percent > 0) {
      const discount = subtotal * (schedule.senior_discount_percent / 100);
      discounts += discount;
      breakdown.push({ item: 'Senior Discount', amount: -discount });
    }
    if (returnDetails.isMilitary && schedule.military_discount_percent > 0) {
      const discount = subtotal * (schedule.military_discount_percent / 100);
      discounts += discount;
      breakdown.push({ item: 'Military Discount', amount: -discount });
    }

    const totalFee = Math.max(0, subtotal - discounts);

    return {
      baseFee,
      scheduleFees,
      formFees,
      creditFees,
      bankProductFees,
      discounts,
      totalFee,
      breakdown
    };
  }
}

export const feeService = new FeeService();
