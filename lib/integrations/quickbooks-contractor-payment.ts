import 'server-only';
import { createHash } from 'node:crypto';

import { logger } from '@/lib/logger';
import { loadQuickBooksConfig, quickBooksRequest, assertQuickBooksProductionEnvironment } from './quickbooks-client';

type Database = any;

type ContractorPayment = {
  contractorName: string;
  contractorEmail?: string | null;
  amountCents: number;
  enrollmentId: string;
  providerTransferId: string;
  memo: string;
};

const escapeQuery = (value: string) => value.replaceAll("'", "\\'");

export async function recordContractorPaymentInQuickBooks(db: Database, input: ContractorPayment) {
  try {
    if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0 || !input.providerTransferId) throw new Error('A valid paid amount and provider transfer reference are required.');
    const reference = createHash('sha256').update(input.providerTransferId).digest('hex').slice(0,32);
    const config = await loadQuickBooksConfig(db);
    try { assertQuickBooksProductionEnvironment(); } catch { return { synced: false as const, reason: 'QuickBooks production configuration is unverified.' }; }
    const { data: mappings, error: mappingError } = await db.from('app_settings').select('key,value').in('key', ['QB_PAYOUT_BANK_ACCOUNT_ID','QB_CONTRACTOR_EXPENSE_ACCOUNT_ID']);
    if (mappingError) throw new Error('QuickBooks payout account mappings could not load.');
    const accounts = Object.fromEntries((mappings || []).map((row: any) => [row.key, row.value]));
    const bankAccountId = accounts.QB_PAYOUT_BANK_ACCOUNT_ID || process.env.QB_PAYOUT_BANK_ACCOUNT_ID;
    const expenseAccountId = accounts.QB_CONTRACTOR_EXPENSE_ACCOUNT_ID || process.env.QB_CONTRACTOR_EXPENSE_ACCOUNT_ID;
    if (!bankAccountId || !expenseAccountId) throw new Error('Select the payout clearing/bank and contractor expense accounts in QuickBooks integration settings.');
    const vendorQuery = encodeURIComponent(
      `select * from Vendor where DisplayName = '${escapeQuery(input.contractorName)}' maxresults 1`,
    );
    const vendorResult = await quickBooksRequest(db, config, `query?query=${vendorQuery}`);
    let vendor = vendorResult.QueryResponse?.Vendor?.[0];
    if (vendor?.PrimaryEmailAddr?.Address && input.contractorEmail && vendor.PrimaryEmailAddr.Address.toLowerCase() !== input.contractorEmail.toLowerCase()) throw new Error('The QuickBooks vendor email does not match this contractor. Review the vendor before recording payment.');
    if (!vendor) {
      const created = await quickBooksRequest(db, config, `vendor?requestid=efh-vendor-${createHash('sha256').update(input.contractorName+'|'+(input.contractorEmail || '')).digest('hex').slice(0,32)}`, {
        method: 'POST',
        body: JSON.stringify({
          DisplayName: input.contractorName,
          CompanyName: input.contractorName,
          ...(input.contractorEmail ? { PrimaryEmailAddr: { Address: input.contractorEmail } } : {}),
        }),
      });
      vendor = created.Vendor;
    }

    if (!vendor?.Id) throw new Error('QuickBooks contractor vendor could not be verified.');

    const amount = input.amountCents / 100;
    const result = await quickBooksRequest(db, config, `purchase?requestid=efh-payout-${reference}`, {
      method: 'POST',
      body: JSON.stringify({
        PaymentType: 'Cash',
        AccountRef: { value: bankAccountId },
        EntityRef: { value: vendor.Id, type: 'Vendor' },
        PrivateNote: `${input.memo} | Provider transfer ${input.providerTransferId}`,
        Line: [
          {
            Amount: amount,
            DetailType: 'AccountBasedExpenseLineDetail',
            Description: input.memo,
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: expenseAccountId },
            },
          },
        ],
      }),
    });
    if (!result.Purchase?.Id) throw new Error('QuickBooks did not return a payment recording ID.');
    return { synced: true as const, paymentId: result.Purchase.Id as string };
  } catch (error) {
    logger.error(
      '[program-holder-payout] QuickBooks recording failed',
      error instanceof Error ? error : new Error(String(error)),
    );
    return {
      synced: false as const,
      reason: error instanceof Error ? error.message : 'QuickBooks recording failed.',
    };
  }
}
