export interface ReturnSubmission { id: string; status: string; taxYear: string; preparerId: string; officeId: string; }

export const returnService = { 
  submitReturn: async () => null,
  async getOfficeReturns(officeId: string, _options?: { status?: string; limit?: number; offset?: number }): Promise<{ returns: ReturnSubmission[]; total: number }> { 
    return { returns: [], total: 0 }; 
  },
  async getPreparerReturns(preparerId: string, _options?: { status?: string; limit?: number; offset?: number }): Promise<{ returns: ReturnSubmission[]; total: number }> { 
    return { returns: [], total: 0 }; 
  },
  async createReturn(data: Partial<ReturnSubmission>): Promise<ReturnSubmission> { 
    return { 
      id: crypto.randomUUID(), 
      status: 'pending', 
      taxYear: data.taxYear || new Date().getFullYear().toString(),
      preparerId: data.preparerId || '',
      officeId: data.officeId || ''
    }; 
  },
};