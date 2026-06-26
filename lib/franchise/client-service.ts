export interface Client { id: string; name: string; email: string; officeId: string; }
export const clientService = {
  async searchClients(officeId: string, search: string): Promise<Client[]> { return []; },
  async listClientsByOffice(officeId: string): Promise<Client[]> { return []; },
  async createClient(body: Partial<Client>): Promise<Client> { return body as Client; },
  async updateClient(id: string, body: Partial<Client>): Promise<Client> { return { ...body, id } as Client; },
  async deleteClient(id: string): Promise<void> {},
};
