export interface Office { 
  id: string; 
  name: string; 
  address: string; 
  owner_id?: string;
  office_code?: string;
  owner_name?: string;
  owner_email?: string;
}
export interface CreateOfficeOptions {
  ownerId?: string;
  status?: string;
}

export const officeService = {
  async getOffice(id: string): Promise<Office | null> { return null; },
  async listOffices(options?: { status?: string; ownerId?: string; limit?: number; offset?: number }): Promise<Office[]> { return []; },
  async createOffice(data: Partial<Office>, ownerId?: string): Promise<Office> { 
    return { 
      ...data, 
      id: data.id || crypto.randomUUID(),
      owner_id: ownerId || data.owner_id 
    } as Office; 
  },
  async updateOffice(id: string, data: Partial<Office>, _userId?: string): Promise<Office> { return { ...data, id } as Office; },
  async deactivateOffice(id: string, _userId?: string): Promise<boolean> { return true; },
};
