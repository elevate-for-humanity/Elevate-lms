import { logger } from '@/lib/logger';
/**
 * IRS MeF Transmission Module
 * Handles direct transmission to IRS e-file system
 * 
 * Supports both simulated (test) and real (SOAP) transmission modes.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MeFAcknowledgment, MeFError } from './acknowledgment';

const EFIN = process.env.IRS_EFIN || '000000';

// IRS MeF endpoints (production vs test)
const IRS_MEF_ENDPOINTS = {
  production: 'https://la.www4.irs.gov/a2a/mef',
  test: 'https://la.www4.irs.gov/a2a/mef/test'
};

export interface MeFSubmission {
  submissionId: string;
  efin?: string;
  softwareId?: string;
  taxYear: number;
  submissionType: 'IRS1040' | 'IRS1040SR' | 'IRS1040NR';
  returnData?: Record<string, unknown>;
  xmlContent: string;
  submittedAt?: string;
  status?: string;
  acknowledgment?: MeFAcknowledgment;
}

export interface TransmissionResult {
  success: boolean;
  submissionId: string;
  transmittedAt: string;
  acknowledgment?: MeFAcknowledgment;
  error?: string;
}

interface TransmissionConfig {
  softwareId: string;
  environment: 'production' | 'test';
  supabaseUrl?: string;
  supabaseServiceKey?: string;
}

export class IRSTransmitter {
  private config: TransmissionConfig;
  private supabase: SupabaseClient | null = null;
  
  constructor(config: TransmissionConfig) {
    this.config = config;
    if (config.supabaseUrl && config.supabaseServiceKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    }
  }
  
  /**
   * Transmit a tax return to the IRS
   */
  async transmit(submission: MeFSubmission): Promise<TransmissionResult> {
    const endpoint = IRS_MEF_ENDPOINTS[this.config.environment];
    
    try {
      // Store submission in database before transmitting
      if (this.supabase) {
        const { error: dbError } = await this.supabase
          .from('mef_submissions')
          .insert({
            submission_id: submission.submissionId,
            efin: EFIN,
            software_id: this.config.softwareId,
            tax_year: submission.taxYear,
            submission_type: submission.submissionType,
            xml_content: submission.xmlContent,
            status: 'transmitting',
            created_at: new Date().toISOString()
          } as Record<string, unknown>)
          .select()
          .single();
        
        if (dbError) {
          logger.warn(`Database error: ${dbError.message}`);
        }
      }
      
      // Build SOAP envelope for IRS transmission
      const soapEnvelope = this.buildSOAPEnvelope(submission);
      
      // In test mode, simulate the transmission
      if (this.config.environment === 'test') {
        return this.simulateTransmission(submission);
      }
      
      // Transmit to IRS
      const response = await fetch(`${endpoint}/transmitter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'SOAPAction': 'TransmitReturn'
        },
        body: soapEnvelope
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Update database with failure
        if (this.supabase) {
          await this.supabase
            .from('mef_submissions')
            .update({
              status: 'transmission_failed',
              error_message: errorText,
              updated_at: new Date().toISOString()
            } as Record<string, unknown>)
            .eq('submission_id', submission.submissionId);
        }
        
        return {
          success: false,
          submissionId: submission.submissionId,
          transmittedAt: new Date().toISOString(),
          error: `IRS transmission failed: ${response.status} - ${errorText}`
        };
      }
      
      const responseXml = await response.text();
      const acknowledgment = this.parseAcknowledgment(responseXml, submission.submissionId);
      
      // Update database with result
      if (this.supabase) {
        await this.supabase
          .from('mef_submissions')
          .update({
            status: acknowledgment.status === 'accepted' ? 'accepted' : 'rejected',
            dcn: acknowledgment.dcn,
            transmitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Record<string, unknown>)
          .eq('submission_id', submission.submissionId);
        
        // Store acknowledgment separately
        await this.supabase
          .from('mef_acknowledgments')
          .insert({
            submission_id: submission.submissionId,
            status: acknowledgment.status,
            dcn: acknowledgment.dcn,
            errors: acknowledgment.errors,
            received_at: new Date().toISOString()
          } as Record<string, unknown>);
      }
      
      return {
        success: acknowledgment.status === 'accepted',
        submissionId: submission.submissionId,
        transmittedAt: new Date().toISOString(),
        acknowledgment
      };
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update database with error
      if (this.supabase) {
        await this.supabase
          .from('mef_submissions')
          .update({
            status: 'error',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          } as Record<string, unknown>)
          .eq('submission_id', submission.submissionId);
      }
      
      return {
        success: false,
        submissionId: submission.submissionId,
        transmittedAt: new Date().toISOString(),
        error: errorMessage
      };
    }
  }
  
  /**
   * Simulate transmission for test environment
   */
  private simulateTransmission(submission: MeFSubmission): TransmissionResult {
    const dcn = `${Date.now()}`.slice(-14);
    const acknowledgment: MeFAcknowledgment = {
      submissionId: submission.submissionId,
      status: 'accepted',
      dcn,
      acceptedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      submissionId: submission.submissionId,
      transmittedAt: new Date().toISOString(),
      acknowledgment
    };
  }
  
  /**
   * Check status of a previously submitted return
   */
  async checkStatus(submissionId: string): Promise<MeFAcknowledgment | null> {
    const endpoint = IRS_MEF_ENDPOINTS[this.config.environment];
    
    // In test mode, return simulated status
    if (this.config.environment === 'test') {
      return {
        submissionId,
        status: 'accepted',
        dcn: `${Date.now()}`.slice(-14),
        acceptedAt: new Date().toISOString()
      };
    }
    
    try {
      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <EFIN>${EFIN}</EFIN>
    <SoftwareId>${this.config.softwareId}</SoftwareId>
  </soap:Header>
  <soap:Body>
    <GetAcknowledgement>
      <SubmissionId>${submissionId}</SubmissionId>
    </GetAcknowledgement>
  </soap:Body>
</soap:Envelope>`;
      
      const response = await fetch(`${endpoint}/acknowledgement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'SOAPAction': 'GetAcknowledgement'
        },
        body: soapEnvelope
      });
      
      if (!response.ok) {
        return null;
      }
      
      const responseXml = await response.text();
      const acknowledgment = this.parseAcknowledgment(responseXml, submissionId);
      
      // Update database
      if (this.supabase) {
        await this.supabase
          .from('mef_submissions')
          .update({
            status: acknowledgment.status,
            dcn: acknowledgment.dcn,
            updated_at: new Date().toISOString()
          } as Record<string, unknown>)
          .eq('submission_id', submissionId);
      }
      
      return acknowledgment;
      
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Get submission from database
   */
  async getSubmission(submissionId: string): Promise<MeFSubmission | null> {
    if (!this.supabase) return null;
    
    const { data, error } = await this.supabase
      .from('mef_submissions')
      .select('*')
      .eq('submission_id', submissionId)
      .single();
    
    if (error || !data) return null;
    
    const d = data as Record<string, unknown>;
    
    return {
      submissionId: d.submission_id as string,
      efin: d.efin as string,
      softwareId: d.software_id as string,
      taxYear: d.tax_year as number,
      submissionType: d.submission_type as 'IRS1040' | 'IRS1040SR' | 'IRS1040NR',
      returnData: d.return_data as Record<string, unknown>,
      xmlContent: d.xml_content as string,
      submittedAt: d.transmitted_at as string,
      status: d.status as string,
      acknowledgment: d.acknowledgment as MeFAcknowledgment
    };
  }
  
  /**
   * Get all submissions for a taxpayer
   */
  async getSubmissionsBySSN(ssnHash: string): Promise<MeFSubmission[]> {
    if (!this.supabase) return [];
    
    const { data, error } = await this.supabase
      .from('mef_submissions')
      .select('*')
      .eq('taxpayer_ssn_hash', ssnHash)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    return (data as Record<string, unknown>[]).map(d => ({
      submissionId: d.submission_id as string,
      efin: d.efin as string,
      softwareId: d.software_id as string,
      taxYear: d.tax_year as number,
      submissionType: d.submission_type as 'IRS1040' | 'IRS1040SR' | 'IRS1040NR',
      returnData: d.return_data as Record<string, unknown>,
      xmlContent: d.xml_content as string,
      submittedAt: d.transmitted_at as string,
      status: d.status as string,
      acknowledgment: d.acknowledgment as MeFAcknowledgment
    }));
  }
  
  private buildSOAPEnvelope(submission: MeFSubmission): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <EFIN>${EFIN}</EFIN>
    <SoftwareId>${this.config.softwareId}</SoftwareId>
    <SubmissionId>${submission.submissionId}</SubmissionId>
    <TaxYear>${submission.taxYear}</TaxYear>
  </soap:Header>
  <soap:Body>
    <TransmitReturn>
      <ReturnData>${Buffer.from(submission.xmlContent).toString('base64')}</ReturnData>
    </TransmitReturn>
  </soap:Body>
</soap:Envelope>`;
  }
  
  private parseAcknowledgment(xml: string, submissionId: string): MeFAcknowledgment {
    // Parse IRS acknowledgment XML response
    const statusMatch = xml.match(/<AcceptanceStatusTxt>(\w+)<\/AcceptanceStatusTxt>/);
    const dcnMatch = xml.match(/<DCN>(\d+)<\/DCN>/);
    const errorRegex = /<Error>[\s\S]*?<ErrorCd>(\w+)<\/ErrorCd>[\s\S]*?<ErrorCategoryTxt>(\w+)<\/ErrorCategoryTxt>[\s\S]*?<ErrorMessageTxt>(.*?)<\/ErrorMessageTxt>[\s\S]*?<\/Error>/g;
    
    const errors: MeFError[] = [];
    let match: RegExpExecArray | null;
    while ((match = errorRegex.exec(xml)) !== null) {
      errors.push({
        errorCode: match[1],
        errorCategory: match[2].toLowerCase() as 'reject' | 'alert',
        errorMessage: match[3]
      });
    }
    
    const status = statusMatch?.[1]?.toLowerCase() === 'accepted' ? 'accepted' : 'rejected';
    
    return {
      submissionId,
      status,
      dcn: dcnMatch?.[1],
      acceptedAt: status === 'accepted' ? new Date().toISOString() : undefined,
      rejectedAt: status === 'rejected' ? new Date().toISOString() : undefined,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

/**
 * Create transmitter instance
 */
export function createTransmitter(config?: Partial<TransmissionConfig>): IRSTransmitter {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return new IRSTransmitter({
    softwareId: config?.softwareId || process.env.IRS_SOFTWARE_ID || 'PENDING',
    environment: config?.environment || (process.env.IRS_ENVIRONMENT as 'production' | 'test') || 'test',
    supabaseUrl,
    supabaseServiceKey
  });
}
