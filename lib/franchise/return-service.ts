export interface TaxReturn {
  id: string;
  preparer_id: string;
  office_id: string;
  status: string;
  officeId?: string;
  preparerId?: string;
  taxYear?: string;
  taxReturn?: Partial<TaxReturn>;
  clientFee?: number;
  [key: string]: unknown;
}

export const returnService = {
  submitReturn: async () => null,
  getPreparerReturns: async (preparerId: string, options?: { taxYear?: string; status?: string; limit?: number; offset?: number }) => [] as TaxReturn[],
  getOfficeReturns: async (officeId: string, options?: { status?: string; taxYear?: string; limit?: number; offset?: number }) => [] as TaxReturn[],
  createReturn: async (data: Partial<TaxReturn>) => null as TaxReturn | null,
};