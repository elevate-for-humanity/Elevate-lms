export interface TaxReturn {
  id: string;
  preparer_id: string;
  office_id: string;
  status: string;
  officeId?: string;
  preparerId?: string;
  taxYear?: string;
}

export const returnService = {
  submitReturn: async () => null,
  getPreparerReturns: async (preparerId: string, _options?: { limit?: number; taxYear?: string }) => [] as TaxReturn[],
  getOfficeReturns: async (officeId: string, _options?: { status?: string; taxYear?: string }) => [] as TaxReturn[],
  createReturn: async (data: Partial<TaxReturn>) => null as TaxReturn | null,
};