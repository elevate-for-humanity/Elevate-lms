export interface EROApplication { id: string; status: string; }
export const eroService = {
  async getApplication(id: string): Promise<EROApplication | null> { return null; },
  async submitApplication(data: unknown): Promise<EROApplication> { return { id: 'new', status: 'pending' }; },
  async signApplication(id: string): Promise<EROApplication> { return { id, status: 'signed' }; },
};
