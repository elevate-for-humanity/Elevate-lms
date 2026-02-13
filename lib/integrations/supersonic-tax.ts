/**
 * SupersonicFastCash Tax Engine — Phase A Provider
 *
 * Stores tax return intake, documents, and status in Supabase.
 * No external API dependency. Transmission layer (Phase 2/3) is separate.
 *
 * Required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Required tables: sfc_tax_returns, sfc_tax_documents
 */

export interface SupersonicTaxReturn {
  id: string;
  taxpayer: {
    firstName: string;
    lastName: string;
    ssn: string;
    dateOfBirth: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  spouse?: {
    firstName: string;
    lastName: string;
    ssn: string;
    dateOfBirth: string;
  };
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household' | 'qualifying_widow';
  taxYear: number;
  income: {
    w2: Array<{
      employer: string;
      ein: string;
      wages: number;
      federalWithholding: number;
      stateWithholding: number;
      socialSecurityWages: number;
      medicareWages: number;
    }>;
    form1099: Array<{
      type: '1099-MISC' | '1099-NEC' | '1099-INT' | '1099-DIV' | '1099-R';
      payer: string;
      ein: string;
      amount: number;
      federalWithholding?: number;
    }>;
    selfEmployment?: {
      businessName: string;
      ein?: string;
      grossReceipts: number;
      expenses: number;
      netProfit: number;
    };
  };
  deductions: {
    standard: boolean;
    itemized?: {
      mortgageInterest: number;
      propertyTax: number;
      charitableContributions: number;
      medicalExpenses: number;
      stateLocalTaxes: number;
    };
  };
  credits: {
    childTaxCredit?: number;
    earnedIncomeCredit?: number;
    educationCredits?: number;
  };
}

export interface SupersonicEFileResult {
  success: boolean;
  submissionId: string;
  acknowledgmentStatus: 'pending' | 'accepted' | 'rejected';
  rejectionCodes?: string[];
  rejectionMessages?: string[];
  submittedAt: Date;
}

export interface SupersonicCalculationResult {
  totalIncome: number;
  adjustedGrossIncome: number;
  taxableIncome: number;
  federalTax: number;
  stateTax: number;
  totalTax: number;
  federalWithholding: number;
  stateWithholding: number;
  refundOrOwed: number;
  isRefund: boolean;
}

class SupersonicTaxEngine {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  }

  private async getDb() {
    if (!this.supabaseUrl || !this.supabaseKey) return null;
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(this.supabaseUrl, this.supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /**
   * Create a new tax return — stores in Supabase as intake record
   */
  async createReturn(taxReturn: SupersonicTaxReturn): Promise<{ returnId: string }> {
    const trackingId = `SFC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const db = await this.getDb();
    if (db) {
      await db.from('sfc_tax_returns').insert({
        tracking_id: trackingId,
        taxpayer_name: `${taxReturn.taxpayer.firstName} ${taxReturn.taxpayer.lastName}`,
        filing_status: taxReturn.filingStatus,
        tax_year: taxReturn.taxYear,
        status: 'received',
        payload: taxReturn,
        created_at: new Date().toISOString(),
      });
    }
    return { returnId: trackingId };
  }

  /**
   * Calculate tax using SupersonicFastCash's calculation engine
   */
  async calculateTax(returnId: string): Promise<SupersonicCalculationResult> {
    const db = await this.getDb();
    if (db) {
      await db.from('sfc_tax_returns')
        .update({ status: 'pending_review', updated_at: new Date().toISOString() })
        .eq('tracking_id', returnId);
    }
    // Calculation engine TBD — returns placeholder until SupersonicFastCash engine is built
    return {
      totalIncome: 0, adjustedGrossIncome: 0, taxableIncome: 0,
      federalTax: 0, stateTax: 0, totalTax: 0,
      federalWithholding: 0, stateWithholding: 0, refundOrOwed: 0, isRefund: false,
    };
  }

  async generateForm1040(returnId: string): Promise<{ pdfUrl: string }> {
    const db = await this.getDb();
    if (db) {
      await db.from('sfc_tax_returns')
        .update({ status: 'generating_forms', updated_at: new Date().toISOString() })
        .eq('tracking_id', returnId);
    }
    return { pdfUrl: '' };
  }

  async eFileReturn(returnId: string, state?: string): Promise<SupersonicEFileResult> {
    const submissionId = `SFC-EFILE-${Date.now()}`;
    const db = await this.getDb();
    if (db) {
      await db.from('sfc_tax_returns')
        .update({
          status: 'queued_for_efile',
          efile_submission_id: submissionId,
          efile_state: state || null,
          updated_at: new Date().toISOString(),
        })
        .eq('tracking_id', returnId);
    }
    return {
      success: true,
      submissionId,
      acknowledgmentStatus: 'pending',
      submittedAt: new Date(),
    };
  }

  async getAcknowledgmentStatus(submissionId: string): Promise<SupersonicEFileResult> {
    const db = await this.getDb();
    if (db) {
      const { data } = await db.from('sfc_tax_returns')
        .select('status, updated_at')
        .eq('efile_submission_id', submissionId)
        .single();
      if (data) {
        return {
          success: data.status === 'accepted',
          submissionId,
          acknowledgmentStatus: data.status === 'accepted' ? 'accepted' : 'pending',
          submittedAt: new Date(data.updated_at),
        };
      }
    }
    return { success: false, submissionId, acknowledgmentStatus: 'pending', submittedAt: new Date() };
  }

  async uploadDocument(
    returnId: string,
    _file: File,
    documentType: 'w2' | '1099' | 'receipt' | 'other'
  ): Promise<{ documentId: string; ocrData?: any }> {
    const documentId = `SFC-DOC-${Date.now()}`;
    const db = await this.getDb();
    if (db) {
      await db.from('sfc_tax_documents').insert({
        document_id: documentId,
        return_tracking_id: returnId,
        document_type: documentType,
        status: 'uploaded',
        created_at: new Date().toISOString(),
      });
    }
    return { documentId };
  }

  async getReturnStatus(returnId: string): Promise<{
    status: 'draft' | 'review' | 'ready' | 'filed' | 'accepted' | 'rejected';
    lastModified: Date;
    preparer?: string;
  }> {
    const db = await this.getDb();
    if (db) {
      const { data } = await db.from('sfc_tax_returns')
        .select('status, updated_at, preparer')
        .eq('tracking_id', returnId)
        .single();
      if (data) {
        const statusMap: Record<string, string> = {
          received: 'draft', pending_review: 'review', generating_forms: 'review',
          queued_for_efile: 'ready', filed: 'filed', accepted: 'accepted', rejected: 'rejected',
        };
        return {
          status: (statusMap[data.status] || 'draft') as any,
          lastModified: new Date(data.updated_at),
          preparer: data.preparer,
        };
      }
    }
    return { status: 'draft', lastModified: new Date() };
  }
}

// Export singleton instance
export const supersonicTaxEngine = new SupersonicTaxEngine();
