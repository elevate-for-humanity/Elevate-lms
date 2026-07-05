export interface Payout { id: string; amount: number; status: string; }
export const payoutService = {
  async getPayout(id: string): Promise<Payout | null> { return null; },
  async listPayouts(officeId: string): Promise<Payout[]> { return []; },
};
