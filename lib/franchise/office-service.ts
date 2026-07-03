export interface Office { id: string; name: string; address: string; owner_id?: string; }
export const officeService = {
  async getOffice(id: string): Promise<Office | null> { return null; },
  async listOffices(options?: { status?: string; ownerId?: string; limit?: number; offset?: number }): Promise<Office[]> { return []; },
  async createOffice(data: Partial<Office>): Promise<Office> { return data as Office; },
  async updateOffice(id: string, data: Partial<Office>): Promise<Office> { return { ...data, id } as Office; },
  async deactivateOffice(id: string): Promise<boolean> { return true; },
};
