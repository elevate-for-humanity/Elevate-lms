/**
 * POST /api/quickbooks/contractor-payment
 *
 * Creates a QuickBooks bill payment for a program holder after voucher approval.
 * Called automatically from the payout queue "Approve & Pay" action.
 *
 * Flow:
 *   1. Look up or create vendor in QB (matched by email)
 *   2. Create a Bill for the payout amount
 *   3. Create a BillPayment to mark it paid
 *   4. Return QB transaction ID for audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QB_BASE_SANDBOX    = 'https://sandbox-quickbooks.api.intuit.com/v3/company';
const QB_BASE_PRODUCTION = 'https://quickbooks.api.intuit.com/v3/company';
const QB_TOKEN_URL       = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

function qbBase() {
  return process.env.QB_ENVIRONMENT === 'production' ? QB_BASE_PRODUCTION : QB_BASE_SANDBOX;
}

async function getAppSetting(key: string): Promise<string | null> {
  try {
    const { getAdminClient } = await import('@/lib/supabase/admin');
    const supabase = await getAdminClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error) {
      logger.warn('[QuickBooks] app_settings read failed', { key, error: error.message });
      return null;
    }
    return typeof data?.value === 'string' ? data.value : null;
  } catch (err) {
    logger.warn('[QuickBooks] app_settings unavailable', { key, err });
    return null;
  }
}

async function persistAppSettings(params: Record<string, string>) {
  try {
    const { getAdminClient } = await import('@/lib/supabase/admin');
    const supabase = await getAdminClient();
    if (!supabase) return;
    await Promise.allSettled(
      Object.entries(params).map(([key, value]) =>
        supabase
          .from('app_settings')
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' }),
      ),
    );
  } catch (err) {
    logger.warn('[QuickBooks] app_settings persist failed', { err });
  }
}

async function getAccessToken(): Promise<string | null> {
  // Try current token first
  const token = process.env.QB_ACCESS_TOKEN ?? await getAppSetting('QB_ACCESS_TOKEN');
  const expiresAt = process.env.QB_TOKEN_EXPIRES ?? await getAppSetting('QB_TOKEN_EXPIRES');

  if (token && expiresAt && new Date(expiresAt) > new Date(Date.now() + 60_000)) {
    return token;
  }

  // Refresh
  const clientId = process.env.QB_CLIENT_ID ?? await getAppSetting('QB_CLIENT_ID');
  const clientSecret = process.env.QB_CLIENT_SECRET ?? await getAppSetting('QB_CLIENT_SECRET');
  const refreshToken = process.env.QB_REFRESH_TOKEN ?? await getAppSetting('QB_REFRESH_TOKEN');
  if (!clientId || !clientSecret || !refreshToken) return null;

  const res = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const nextExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  await persistAppSettings({
    QB_ACCESS_TOKEN: data.access_token,
    QB_REFRESH_TOKEN: data.refresh_token,
    QB_TOKEN_EXPIRES: nextExpiresAt,
  });

  return data.access_token ?? null;
}

async function qbRequest(method: string, path: string, body?: unknown) {
  const token   = await getAccessToken();
  const realmId = process.env.QB_REALM_ID ?? await getAppSetting('QB_REALM_ID');
  if (!token || !realmId) throw new Error('QuickBooks not connected');

  const url = `${qbBase()}/${realmId}/${path}?minorversion=65`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const intuitTid = res.headers.get('intuit_tid') ?? res.headers.get('Intuit-Tid') ?? 'unknown';
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.Fault?.Error?.[0]?.Message ?? `QB API error ${res.status}`;
    logger.error(`[QuickBooks] ${method} ${path} failed`, { intuit_tid: intuitTid, message: msg });
    throw new Error(msg);
  }
  return data;
}

async function findOrCreateVendor(name: string, email: string) {
  // Search by email
  const query = `SELECT * FROM Vendor WHERE PrimaryEmailAddr = '${email.replace(/'/g, "\\'")}' MAXRESULTS 1`;
  const search = await qbRequest('GET', `query?query=${encodeURIComponent(query)}`);
  const existing = search?.QueryResponse?.Vendor?.[0];
  if (existing) return existing;

  // Create vendor
  const created = await qbRequest('POST', 'vendor', {
    DisplayName:      name,
    PrimaryEmailAddr: { Address: email },
    Vendor1099:       true, // Mark as 1099 contractor
  });
  return created?.Vendor;
}

async function createBill(vendorId: string, amount: number, memo: string, txnDate: string) {
  const bill = await qbRequest('POST', 'bill', {
    VendorRef:  { value: vendorId },
    TxnDate:    txnDate,
    DueDate:    txnDate,
    PrivateNote: memo,
    Line: [{
      Amount:          amount,
      DetailType:      'AccountBasedExpenseLineDetail',
      AccountBasedExpenseLineDetail: {
        AccountRef: { name: 'Program Holder Payments' }, // QB account name
      },
    }],
  });
  return bill?.Bill;
}

async function createBillPayment(vendorId: string, billId: string, amount: number, txnDate: string) {
  const payment = await qbRequest('POST', 'billpayment', {
    VendorRef:   { value: vendorId },
    PayType:     'CHECK',
    TxnDate:     txnDate,
    TotalAmt:    amount,
    Line: [{
      Amount:    amount,
      LinkedTxn: [{ TxnId: billId, TxnType: 'Bill' }],
    }],
  });
  return payment?.BillPayment;
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { enrollment_id, amount, program_holder_name, program_holder_email, memo } =
    await request.json() as {
      enrollment_id: string;
      amount: number;
      program_holder_name: string;
      program_holder_email: string;
      memo?: string;
    };

  if (!enrollment_id || !amount || !program_holder_name || !program_holder_email) {
    return safeError('enrollment_id, amount, program_holder_name, program_holder_email required', 400);
  }

  if (!process.env.QB_ACCESS_TOKEN && !process.env.QB_REFRESH_TOKEN) {
    return safeError('QuickBooks not connected. Go to /admin/integrations/quickbooks to connect.', 400);
  }

  try {
    const txnDate = new Date().toISOString().split('T')[0];
    const paymentMemo = memo ?? `Program holder payment — enrollment ${enrollment_id}`;

    // 1. Find or create vendor
    const vendor = await findOrCreateVendor(program_holder_name, program_holder_email);
    if (!vendor?.Id) throw new Error('Failed to create vendor in QuickBooks');

    // 2. Create bill
    const bill = await createBill(vendor.Id, amount, paymentMemo, txnDate);
    if (!bill?.Id) throw new Error('Failed to create bill in QuickBooks');

    // 3. Create bill payment
    const payment = await createBillPayment(vendor.Id, bill.Id, amount, txnDate);
    if (!payment?.Id) throw new Error('Failed to create bill payment in QuickBooks');

    return NextResponse.json({
      success:    true,
      qb_vendor_id:  vendor.Id,
      qb_bill_id:    bill.Id,
      qb_payment_id: payment.Id,
      amount,
      memo: paymentMemo,
    });
  } catch (err) {
    return safeInternalError(err, 'QuickBooks payment failed');
  }
}
