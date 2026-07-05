export interface EROApplication { id: string; status: string; }
export interface EROConfig { taxId?: string; businessName?: string; address?: string; }

export const eroService = {
  async getApplication(id: string): Promise<EROApplication | null> { return null; },
  async submitApplication(data: unknown): Promise<EROApplication> { return { id: 'new', status: 'pending' }; },
  async signApplication(id: string): Promise<EROApplication> { return { id, status: 'signed' }; },
  async getEROConfig(_applicationId: string): Promise<EROConfig | null> { return null; },
  async setEROConfig(_applicationId: string, _config: Partial<EROConfig>): Promise<EROConfig> { return {}; },
  async validateERO(_applicationId: string): Promise<{ valid: boolean; errors?: string[] }> { return { valid: true }; },
  async getPendingSignatures(_applicationId: string): Promise<Array<{ id: string; name: string; status: string }>> { return []; },
  async batchSign(_ids: string[]): Promise<EROApplication[]> { return []; },
};
