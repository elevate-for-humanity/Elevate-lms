import 'server-only';

import { logger } from '@/lib/logger';

const QB_BASE = 'https://quickbooks.api.intuit.com/v3/company';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

type Database = any;

type ContractorPayment = {
  contractorName: string;
  contractorEmail?: string | null;
  amountCents: number;
  enrollmentId: string;
  stripeTransferId: string;
  memo: string;
};

async function loadConfig(db: Database) {
  const keys = [
    'QB_CLIENT_ID',
    'QB_CLIENT_SECRET',
    'QB_ACCESS_TOKEN',
    'QB_REFRESH_TOKEN',
    'QB_REALM_ID',
    'QB_PAYOUT_BANK_ACCOUNT_ID',
    'QB_CONTRACTOR_EXPENSE_ACCOUNT_ID',
  ];
  const { data } = await db.from('app_settings').select('key,value').in('key', keys);
  const stored = Object.fromEntries((data || []).map((row: any) => [row.key, row.value]));
  const value = (key: string) => stored[key] || process.env[key] || '';
  return {
    clientId: value('QB_CLIENT_ID'),
    clientSecret: value('QB_CLIENT_SECRET'),
    accessToken: value('QB_ACCESS_TOKEN'),
    refreshToken: value('QB_REFRESH_TOKEN'),
    realmId: value('QB_REALM_ID'),
    bankAccountId: value('QB_PAYOUT_BANK_ACCOUNT_ID'),
    expenseAccountId: value('QB_CONTRACTOR_EXPENSE_ACCOUNT_ID'),
  };
}

async function refreshToken(db: Database, config: Awaited<ReturnType<typeof loadConfig>>) {
  if (!config.clientId || !config.clientSecret || !config.refreshToken) return null;
  const response = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: config.refreshToken }),
  });
  if (!response.ok) return null;
  const token = await response.json();
  const rows = [
    { key: 'QB_ACCESS_TOKEN', value: token.access_token, updated_at: new Date().toISOString() },
    ...(token.refresh_token
      ? [{ key: 'QB_REFRESH_TOKEN', value: token.refresh_token, updated_at: new Date().toISOString() }]
      : []),
  ];
  await db.from('app_settings').upsert(rows, { onConflict: 'key' });
  return token.access_token as string;
}

async function request(realmId: string, token: string, path: string, init?: RequestInit) {
  const separator = path.includes('?') ? '&' : '?';
  return fetch(`${QB_BASE}/${realmId}/${path}${separator}minorversion=75`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

async function authorizedRequest(
  db: Database,
  config: Awaited<ReturnType<typeof loadConfig>>,
  path: string,
  init?: RequestInit,
) {
  let response = await request(config.realmId, config.accessToken, path, init);
  if (response.status === 401) {
    const token = await refreshToken(db, config);
    if (!token) throw new Error('QuickBooks authorization expired. Reconnect QuickBooks.');
    response = await request(config.realmId, token, path, init);
  }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`QuickBooks request failed (${response.status}): ${detail}`);
  }
  return response.json();
}

const escapeQuery = (value: string) => value.replaceAll("'", "\\'");

export async function recordContractorPaymentInQuickBooks(db: Database, input: ContractorPayment) {
  const config = await loadConfig(db);
  if (!config.accessToken || !config.realmId) {
    return { synced: false as const, reason: 'QuickBooks is not connected.' };
  }

  try {
    const vendorQuery = encodeURIComponent(
      `select * from Vendor where DisplayName = '${escapeQuery(input.contractorName)}' maxresults 1`,
    );
    const vendorResult = await authorizedRequest(db, config, `query?query=${vendorQuery}`);
    let vendor = vendorResult.QueryResponse?.Vendor?.[0];
    if (!vendor) {
      const created = await authorizedRequest(db, config, 'vendor', {
        method: 'POST',
        body: JSON.stringify({
          DisplayName: input.contractorName,
          CompanyName: input.contractorName,
          ...(input.contractorEmail ? { PrimaryEmailAddr: { Address: input.contractorEmail } } : {}),
        }),
      });
      vendor = created.Vendor;
    }

    let bankAccountId = config.bankAccountId;
    if (!bankAccountId) {
      const bankQuery = encodeURIComponent("select * from Account where AccountType = 'Bank' maxresults 1");
      const result = await authorizedRequest(db, config, `query?query=${bankQuery}`);
      bankAccountId = result.QueryResponse?.Account?.[0]?.Id;
    }
    let expenseAccountId = config.expenseAccountId;
    if (!expenseAccountId) {
      const expenseQuery = encodeURIComponent("select * from Account where AccountType = 'Expense' maxresults 1");
      const result = await authorizedRequest(db, config, `query?query=${expenseQuery}`);
      expenseAccountId = result.QueryResponse?.Account?.[0]?.Id;
    }
    if (!vendor?.Id || !bankAccountId || !expenseAccountId) {
      throw new Error('QuickBooks vendor, payout bank, or contractor expense account is missing.');
    }

    const amount = input.amountCents / 100;
    const result = await authorizedRequest(db, config, 'purchase', {
      method: 'POST',
      body: JSON.stringify({
        PaymentType: 'Check',
        AccountRef: { value: bankAccountId },
        EntityRef: { value: vendor.Id, type: 'Vendor' },
        PrivateNote: `${input.memo} | Stripe transfer ${input.stripeTransferId}`,
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
    return { synced: true as const, paymentId: result.Purchase?.Id as string };
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
