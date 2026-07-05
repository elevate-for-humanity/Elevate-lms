export interface EROApplication { 
  id: string; 
  status: string;
  office_id?: string;
  ero_preparer_id?: string;
  efin?: string;
  firm_name?: string;
}
export interface EROConfig { 
  taxId?: string; 
  businessName?: string; 
  address?: string;
  office_id?: string;
  ero_preparer_id?: string;
  efin?: string;
  firm_name?: string;
  [key: string]: unknown;
}

export const eroService = {
  async getApplication(id: string): Promise<EROApplication | null> { return null; },
  async submitApplication(data: unknown): Promise<EROApplication> { return { id: 'new', status: 'pending' }; },
  async signApplication(id: string): Promise<EROApplication> { return { id, status: 'signed' }; },
  async getEROConfig(officeId: string): Promise<EROConfig | null> { return null; },
  async setEROConfig(config: Partial<EROConfig>, _userId?: string): Promise<EROConfig> { 
    return { 
      ...config,
      businessName: config.businessName || config.firm_name,
      taxId: config.taxId
    }; 
  },
  async validateERO(officeId: string): Promise<{ valid: boolean; errors?: string[] }> { return { valid: true }; },
  async getPendingSignatures(officeId: string): Promise<Array<{ id: string; name: string; status: string }>> { return []; },
  async batchSign(ids: string[], _officeId?: string, _ip?: string, _userId?: string): Promise<EROApplication[]> { return ids.map(id => ({ id, status: 'signed' })); },
};
