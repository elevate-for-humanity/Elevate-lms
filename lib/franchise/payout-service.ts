export interface Payout { id: string; amount: number; status: string; office_id?: string; }
export const payoutService = {
  async getPayout(id: string): Promise<Payout | null> { return null; },
  async listPayouts(officeId: string): Promise<Payout[]> { return []; },
  async approvePayout(id: string): Promise<Payout> { return { id, amount: 0, status: 'approved' }; },
  async markPaid(id: string): Promise<Payout> { return { id, amount: 0, status: 'paid' }; },
  async generateOfficePayouts(officeId: string): Promise<Payout[]> { return []; },
};
