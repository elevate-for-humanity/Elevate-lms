export interface Payout { 
  id: string; 
  amount: number; 
  status: string;
  office_id?: string;
}
export const payoutService = {
  async getPayout(id: string): Promise<Payout | null> { return null; },
  async listPayouts(officeId: string): Promise<Payout[]> { return []; },
  async approvePayout(payoutId: string, userId: string): Promise<Payout | null> { return null; },
  async markPaid(payoutId: string, paymentDetails: { method?: string; reference?: string }): Promise<Payout | null> { return null; },
  async generateOfficePayouts(officeId: string, options?: { startDate?: string; endDate?: string }): Promise<Payout[]> { return []; },
};
