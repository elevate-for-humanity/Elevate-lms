/**
 * SupersonicFastCash Tax Software
 * SupersonicFastCash in-house tax preparation engine
 *
 * Required env vars: SUPERSONIC_ACCOUNT_NUMBER, SUPERSONIC_SERIAL_NUMBER, SUPERSONIC_EFILE_PASSWORD
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
  private accountNumber: string;
  private serialNumber: string;
  private efilePassword: string;
  private apiUrl: string;

  constructor() {
    this.accountNumber = process.env.SUPERSONIC_ACCOUNT_NUMBER || '';
    this.serialNumber = process.env.SUPERSONIC_SERIAL_NUMBER || '';
    this.efilePassword = process.env.SUPERSONIC_EFILE_PASSWORD || '';
    this.apiUrl = process.env.SUPERSONIC_TAX_API_URL || 'https://api.supersonicsoftware.com';

    if (!this.accountNumber || !this.serialNumber) {
      console.warn('SupersonicFastCash credentials not configured');
    }
  }

  /**
   * Create a new tax return in SupersonicFastCash Software
   */
  async createReturn(taxReturn: SupersonicTaxReturn): Promise<{ returnId: string }> {
    try {
      // In production, this would call SupersonicFastCash's actual API
      // For now, we'll simulate the response

      const response = await this.makeRequest('/returns/create', {
        method: 'POST',
        body: JSON.stringify({
          account: this.accountNumber,
          serial: this.serialNumber,
          taxReturn,
        }),
      });

      return {
        returnId: response.returnId || `SFC-${Date.now()}`,
      };
    } catch (error) {
      console.error('SupersonicFastCash create return error:', error);
      throw new Error('Failed to create return in SupersonicFastCash Software');
    }
  }

  /**
   * Calculate tax using SupersonicFastCash's calculation engine
   */
  async calculateTax(returnId: string): Promise<SupersonicCalculationResult> {
    try {
      const response = await this.makeRequest(`/returns/${returnId}/calculate`, {
        method: 'POST',
      });

      return response.calculation;
    } catch (error) {
      console.error('SupersonicFastCash calculation error:', error);
      throw new Error('Failed to calculate tax');
    }
  }

  /**
   * Generate Form 1040 PDF
   */
  async generateForm1040(returnId: string): Promise<{ pdfUrl: string }> {
    try {
      const response = await this.makeRequest(`/returns/${returnId}/forms/1040`, {
        method: 'GET',
      });

      return {
        pdfUrl: response.pdfUrl,
      };
    } catch (error) {
      console.error('SupersonicFastCash form generation error:', error);
      throw new Error('Failed to generate Form 1040');
    }
  }

  /**
   * E-file return to IRS
   */
  async eFileReturn(returnId: string, state?: string): Promise<SupersonicEFileResult> {
    try {
      const response = await this.makeRequest(`/returns/${returnId}/efile`, {
        method: 'POST',
        body: JSON.stringify({
          password: this.efilePassword,
          state,
        }),
      });

      return {
        success: true,
        submissionId: response.submissionId,
        acknowledgmentStatus: 'pending',
        submittedAt: new Date(),
      };
    } catch (error) {
      console.error('SupersonicFastCash e-file error:', error);
      throw new Error('Failed to e-file return');
    }
  }

  /**
   * Check e-file acknowledgment status
   */
  async getAcknowledgmentStatus(submissionId: string): Promise<SupersonicEFileResult> {
    try {
      const response = await this.makeRequest(`/efile/status/${submissionId}`, {
        method: 'GET',
      });

      return {
        success: response.status === 'accepted',
        submissionId,
        acknowledgmentStatus: response.status,
        rejectionCodes: response.rejectionCodes,
        rejectionMessages: response.rejectionMessages,
        submittedAt: new Date(response.submittedAt),
      };
    } catch (error) {
      console.error('SupersonicFastCash status check error:', error);
      throw new Error('Failed to check acknowledgment status');
    }
  }

  /**
   * Upload document to SupersonicFastCash Cloud
   */
  async uploadDocument(
    returnId: string,
    file: File,
    documentType: 'w2' | '1099' | 'receipt' | 'other'
  ): Promise<{ documentId: string; ocrData?: any }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('returnId', returnId);
      formData.append('documentType', documentType);

      const response = await this.makeRequest('/documents/upload', {
        method: 'POST',
        body: formData,
      });

      return {
        documentId: response.documentId,
        ocrData: response.ocrData, // SupersonicFastCash's OCR extraction
      };
    } catch (error) {
      console.error('SupersonicFastCash document upload error:', error);
      throw new Error('Failed to upload document');
    }
  }

  /**
   * Get return status
   */
  async getReturnStatus(returnId: string): Promise<{
    status: 'draft' | 'review' | 'ready' | 'filed' | 'accepted' | 'rejected';
    lastModified: Date;
    preparer?: string;
  }> {
    try {
      const response = await this.makeRequest(`/returns/${returnId}/status`, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('SupersonicFastCash status error:', error);
      throw new Error('Failed to get return status');
    }
  }

  /**
   * Make API request to SupersonicFastCash Software
   * Note: This is a placeholder - actual SupersonicFastCash API may have different endpoints
   */
  private async makeRequest(endpoint: string, options: RequestInit): Promise<any> {
    // For development/testing, return mock data
    if (process.env.NODE_ENV === 'development' || !this.accountNumber) {
      return this.getMockResponse(endpoint);
    }

    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Supersonic-Account': this.accountNumber,
          'X-Supersonic-Serial': this.serialNumber,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`SupersonicFastCash API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SupersonicFastCash API request failed:', error);
      throw error;
    }
  }

  /**
   * Mock responses for development
   */
  private getMockResponse(endpoint: string): any {
    if (endpoint.includes('/create')) {
      return { returnId: `SFC-${Date.now()}` };
    }
    if (endpoint.includes('/calculate')) {
      return {
        calculation: {
          totalIncome: 50000,
          adjustedGrossIncome: 48000,
          taxableIncome: 33400,
          federalTax: 3800,
          stateTax: 1500,
          totalTax: 5300,
          federalWithholding: 6000,
          stateWithholding: 2000,
          refundOrOwed: 2700,
          isRefund: true,
        },
      };
    }
    if (endpoint.includes('/forms/1040')) {
      return { pdfUrl: '/mock-form-1040.pdf' };
    }
    if (endpoint.includes('/efile')) {
      return { submissionId: `EFILE-${Date.now()}`, status: 'pending' };
    }
    if (endpoint.includes('/status')) {
      return {
        status: 'draft',
        lastModified: new Date(),
        preparer: 'Tax Pro',
      };
    }
    if (endpoint.includes('/upload')) {
      return {
        documentId: `DOC-${Date.now()}`,
        ocrData: {
          employer: 'Sample Employer',
          wages: 50000,
          federalWithholding: 6000,
        },
      };
    }
    return {};
  }
}

// Export singleton instance
export const supersonicTaxEngine = new SupersonicTaxEngine();
