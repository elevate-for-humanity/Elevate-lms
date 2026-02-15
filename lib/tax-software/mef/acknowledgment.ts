import { logger } from '@/lib/logger';
/**
 * IRS MeF Acknowledgment Handler
 * Processes IRS responses and manages return status
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// MeF types
export interface MeFAcknowledgment {
  submissionId: string;
  status: 'accepted' | 'rejected' | 'pending';
  dcn?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  errors?: MeFError[];
}

export interface MeFError {
  errorCode: string;
  errorCategory: 'reject' | 'alert';
  errorMessage: string;
  fieldName?: string;
  ruleNumber?: string;
}

interface AcknowledgmentHandlerConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
}

// Common IRS rejection codes with resolutions
export const REJECTION_CODES: Record<string, { category: string; description: string; resolution: string }> = {
  'IND-031': {
    category: 'Identity',
    description: 'Primary SSN has already been used on a return',
    resolution: 'Verify SSN is correct. If duplicate filing suspected, file Form 14039 Identity Theft Affidavit'
  },
  'IND-032': {
    category: 'Identity',
    description: 'Spouse SSN has already been used on a return',
    resolution: 'Verify spouse SSN is correct. If duplicate filing suspected, file Form 14039'
  },
  'IND-181': {
    category: 'Dependent',
    description: 'Dependent SSN has already been claimed on another return',
    resolution: 'Verify dependent SSN and eligibility. May need to paper file with documentation'
  },
  'IND-510': {
    category: 'AGI',
    description: 'Prior year AGI does not match IRS records',
    resolution: 'Verify prior year AGI from last year\'s return or use IRS IP PIN if available'
  },
  'IND-511': {
    category: 'AGI',
    description: 'Prior year PIN does not match IRS records',
    resolution: 'Use correct prior year AGI instead of PIN'
  },
  'R0000-500': {
    category: 'Schema',
    description: 'XML schema validation error',
    resolution: 'Technical error - contact support'
  },
  'R0000-902': {
    category: 'Business',
    description: 'Business rule validation failed',
    resolution: 'Review return for calculation errors'
  },
  'F1040-070': {
    category: 'Filing Status',
    description: 'Filing status inconsistent with dependent information',
    resolution: 'Verify filing status matches household situation'
  },
  'SEIC-F1040-501': {
    category: 'EITC',
    description: 'EITC claimed but earned income requirements not met',
    resolution: 'Verify earned income and EITC eligibility'
  }
};

export class AcknowledgmentHandler {
  private supabase: SupabaseClient | null = null;
  
  constructor(config?: AcknowledgmentHandlerConfig) {
    if (config?.supabaseUrl && config?.supabaseServiceKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    }
  }
  
  /**
   * Process an acknowledgment from the IRS
   */
  async processAcknowledgment(acknowledgment: MeFAcknowledgment): Promise<void> {
    if (!this.supabase) {
      logger.info('Supabase not configured, skipping database updates');
      return;
    }

    // Update submission status
    await this.supabase
      .from('mef_submissions')
      .update({
        status: acknowledgment.status,
        dcn: acknowledgment.dcn,
        updated_at: new Date().toISOString()
      } as Record<string, unknown>)
      .eq('submission_id', acknowledgment.submissionId);
    
    // Store acknowledgment record
    await this.supabase
      .from('mef_acknowledgments')
      .upsert({
        submission_id: acknowledgment.submissionId,
        status: acknowledgment.status,
        dcn: acknowledgment.dcn,
        accepted_at: acknowledgment.acceptedAt,
        rejected_at: acknowledgment.rejectedAt,
        errors: acknowledgment.errors,
        updated_at: new Date().toISOString()
      } as Record<string, unknown>);
    
    // If accepted, update tax return record
    if (acknowledgment.status === 'accepted') {
      await this.handleAcceptedReturn(acknowledgment);
    }
    
    // If rejected, log errors for review
    if (acknowledgment.status === 'rejected' && acknowledgment.errors) {
      await this.handleRejectedReturn(acknowledgment);
    }
  }
  
  /**
   * Handle an accepted return
   */
  private async handleAcceptedReturn(acknowledgment: MeFAcknowledgment): Promise<void> {
    if (!this.supabase) return;

    // Get submission details
    const { data: submission } = await this.supabase
      .from('mef_submissions')
      .select('*')
      .eq('submission_id', acknowledgment.submissionId)
      .single();
    
    if (!submission) return;
    
    const submissionData = submission as Record<string, unknown>;

    // Update tax_returns table
    await this.supabase
      .from('tax_returns')
      .update({
        status: 'accepted',
        dcn: acknowledgment.dcn,
        accepted_at: acknowledgment.acceptedAt,
        updated_at: new Date().toISOString()
      } as Record<string, unknown>)
      .eq('submission_id', acknowledgment.submissionId);
    
    // Create notification for client
    await this.supabase
      .from('notifications')
      .insert({
        user_id: submissionData.user_id,
        type: 'tax_return_accepted',
        title: 'Tax Return Accepted',
        message: `Your ${submissionData.tax_year} tax return has been accepted by the IRS. DCN: ${acknowledgment.dcn}`,
        data: {
          submissionId: acknowledgment.submissionId,
          dcn: acknowledgment.dcn,
          taxYear: submissionData.tax_year
        },
        created_at: new Date().toISOString()
      } as Record<string, unknown>);
  }
  
  /**
   * Handle a rejected return
   */
  private async handleRejectedReturn(acknowledgment: MeFAcknowledgment): Promise<void> {
    if (!this.supabase) return;

    // Get submission details
    const { data: submission } = await this.supabase
      .from('mef_submissions')
      .select('*')
      .eq('submission_id', acknowledgment.submissionId)
      .single();
    
    if (!submission) return;
    
    const submissionData = submission as Record<string, unknown>;

    // Update tax_returns table
    await this.supabase
      .from('tax_returns')
      .update({
        status: 'rejected',
        rejection_errors: acknowledgment.errors,
        rejected_at: acknowledgment.rejectedAt,
        updated_at: new Date().toISOString()
      } as Record<string, unknown>)
      .eq('submission_id', acknowledgment.submissionId);
    
    // Log each error
    if (acknowledgment.errors) {
      for (const error of acknowledgment.errors) {
        await this.supabase
          .from('mef_errors')
          .insert({
            submission_id: acknowledgment.submissionId,
            error_code: error.errorCode,
            error_category: error.errorCategory,
            error_message: error.errorMessage,
            field_name: error.fieldName,
            rule_number: error.ruleNumber,
            created_at: new Date().toISOString()
          } as Record<string, unknown>);
      }
    }
    
    // Create notification for client
    await this.supabase
      .from('notifications')
      .insert({
        user_id: submissionData.user_id,
        type: 'tax_return_rejected',
        title: 'Tax Return Rejected',
        message: `Your ${submissionData.tax_year} tax return was rejected by the IRS. Please review and correct the errors.`,
        data: {
          submissionId: acknowledgment.submissionId,
          taxYear: submissionData.tax_year,
          errors: acknowledgment.errors
        },
        created_at: new Date().toISOString()
      } as Record<string, unknown>);
  }
  
  /**
   * Get acknowledgment for a submission
   */
  async getAcknowledgment(submissionId: string): Promise<MeFAcknowledgment | null> {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase
      .from('mef_acknowledgments')
      .select('*')
      .eq('submission_id', submissionId)
      .single();
    
    if (error || !data) return null;
    
    const ackData = data as Record<string, unknown>;
    
    return {
      submissionId: ackData.submission_id as string,
      status: ackData.status as 'accepted' | 'rejected' | 'pending',
      dcn: ackData.dcn as string | undefined,
      acceptedAt: ackData.accepted_at as string | undefined,
      rejectedAt: ackData.rejected_at as string | undefined,
      errors: ackData.errors as MeFError[] | undefined
    };
  }
  
  /**
   * Get all errors for a submission
   */
  async getErrors(submissionId: string): Promise<MeFError[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('mef_errors')
      .select('*')
      .eq('submission_id', submissionId);
    
    if (error || !data) return [];
    
    return (data as Record<string, unknown>[]).map(e => ({
      errorCode: e.error_code as string,
      errorCategory: e.error_category as 'reject' | 'alert',
      errorMessage: e.error_message as string,
      fieldName: e.field_name as string | undefined,
      ruleNumber: e.rule_number as string | undefined
    }));
  }
  
  /**
   * Check if a return can be resubmitted
   */
  async canResubmit(submissionId: string): Promise<boolean> {
    if (!this.supabase) return false;

    const { data } = await this.supabase
      .from('mef_submissions')
      .select('status, resubmission_count')
      .eq('submission_id', submissionId)
      .single();
    
    if (!data) return false;
    
    const submissionData = data as Record<string, unknown>;
    
    // Can resubmit if rejected and hasn't exceeded max attempts
    return submissionData.status === 'rejected' && ((submissionData.resubmission_count as number) || 0) < 5;
  }

  /**
   * Get resolution for an error code
   */
  getResolution(errorCode: string): string {
    return REJECTION_CODES[errorCode]?.resolution || 
      'Please review the error and correct the return. Contact support if the issue persists.';
  }

  /**
   * Format user-friendly message for acknowledgment
   */
  formatUserMessage(ack: MeFAcknowledgment): string {
    if (ack.status === 'accepted') {
      let message = `Your tax return has been accepted by the IRS.\n`;
      message += `Submission ID: ${ack.submissionId}\n`;
      if (ack.dcn) {
        message += `DCN: ${ack.dcn}\n`;
      }
      message += `You can check your refund status at irs.gov/refunds`;
      return message;
    }
    
    if (ack.status === 'rejected') {
      let message = `Your tax return was rejected by the IRS.\n\n`;
      message += `Submission ID: ${ack.submissionId}\n\n`;
      message += `Errors:\n`;
      
      for (const error of ack.errors || []) {
        message += `\n• Error ${error.errorCode}: ${error.errorMessage}\n`;
        message += `  Resolution: ${this.getResolution(error.errorCode)}\n`;
      }
      
      message += `\nPlease correct these issues and resubmit your return.`;
      return message;
    }
    
    if (ack.status === 'pending') {
      return `Your tax return is being processed. Please check back later for status updates.\nSubmission ID: ${ack.submissionId}`;
    }
    
    return `An error occurred processing your return. Please contact support.\nSubmission ID: ${ack.submissionId}`;
  }
}

/**
 * Create acknowledgment handler instance
 */
export function createAcknowledgmentHandler(): AcknowledgmentHandler {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseServiceKey) {
    return new AcknowledgmentHandler({
      supabaseUrl,
      supabaseServiceKey
    });
  }
  
  return new AcknowledgmentHandler();
}
