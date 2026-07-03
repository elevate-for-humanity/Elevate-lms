export interface Client { id: string; name: string; email: string; officeId: string; }
export const clientService = {
  async searchClients(officeId: string, search: string): Promise<Client[]> { return []; },
  async listClientsByOffice(officeId: string, options?: { status?: string; limit?: number; offset?: number }): Promise<{ clients: Client[]; total: number }> { return { clients: [], total: 0 }; },
  async createClient(body: Partial<Client>): Promise<Client> { return body as Client; },
  async updateClient(id: string, body: Partial<Client>): Promise<Client> { return { ...body, id } as Client; },
  async deleteClient(id: string): Promise<void> {},
};
