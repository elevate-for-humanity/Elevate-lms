export interface EROApplication { id: string; status: string; }
export interface EROConfig { 
  taxId?: string; 
  businessName?: string; 
  address?: string;
  ero_preparer_id?: string;
  efin?: string;
  firm_name?: string;
  [key: string]: unknown;
}

export const eroService = {
  async getApplication(id: string): Promise<EROApplication | null> { return null; },
  async submitApplication(data: unknown): Promise<EROApplication> { return { id: 'new', status: 'pending' }; },
  async signApplication(id: string, _userId?: string): Promise<EROApplication> { return { id, status: 'signed' }; },
  async getEROConfig(_officeId: string): Promise<EROConfig | null> { return null; },
  async setEROConfig(_officeId: string, _config: Partial<EROConfig>, _userId?: string): Promise<EROConfig> { return {}; },
  async validateERO(_applicationId: string): Promise<{ valid: boolean; errors?: string[] }> { return { valid: true }; },
  async getPendingSignatures(_applicationId: string): Promise<Array<{ id: string; name: string; status: string }>> { return []; },
  async batchSign(_submissionIds: string[], _officeId: string, _ipAddress?: string, _userId?: string): Promise<EROApplication[]> { return []; },
};
