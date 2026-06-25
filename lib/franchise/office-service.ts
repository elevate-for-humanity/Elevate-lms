export interface Office { id: string; name: string; address: string; }
export const officeService = {
  async getOffice(id: string): Promise<Office | null> { return null; },
  async listOffices(): Promise<Office[]> { return []; },
  async createOffice(data: Partial<Office>): Promise<Office> { return data as Office; },
};
