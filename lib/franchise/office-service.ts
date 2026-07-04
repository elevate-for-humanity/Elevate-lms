export interface Office { id: string; name: string; address: string; owner_id?: string; }
export const officeService = {
  async getOffice(id: string): Promise<Office | null> { return null; },
  async listOffices(options?: { status?: string; ownerId?: string; limit?: number; offset?: number }): Promise<Office[]> { return []; },
  async createOffice(data: Partial<Office>, _userId?: string): Promise<Office> { return data as Office; },
  async updateOffice(id: string, data: Partial<Office>, _userId?: string): Promise<Office> { return { ...data, id } as Office; },
  async deactivateOffice(id: string, _userId?: string): Promise<boolean> { return true; },
};
