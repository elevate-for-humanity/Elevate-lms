import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';
export const dynamic = 'force-dynamic';
async function context(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return { error: auth.error };
  if (!auth.effectiveRoles.some(role => ['admin','super_admin'].includes(role))) return { error: NextResponse.json({ error: 'Administrator access required.' }, { status: 403 }) };
  const db = await requireAdminClient();
  return { db, config: await loadQuickBooksConfig(db) };
}
export async function GET(request: Request) {
  try {
    const ctx = await context(request); if (ctx.error) return ctx.error;
    const [bank, expense, saved] = await Promise.all([
      quickBooksRequest(ctx.db, ctx.config!, `query?query=${encodeURIComponent("select * from Account where AccountType = 'Bank' and Active = true maxresults 1000")}`),
      quickBooksRequest(ctx.db, ctx.config!, `query?query=${encodeURIComponent("select * from Account where AccountType = 'Expense' and Active = true maxresults 1000")}`),
      ctx.db!.from('app_settings').select('key,value').in('key',['QB_PAYOUT_BANK_ACCOUNT_ID','QB_CONTRACTOR_EXPENSE_ACCOUNT_ID']),
    ]);
    if (saved.error) throw new Error('Settings unavailable');
    const list = (result: any) => (result.QueryResponse?.Account || []).map((a: any) => ({ id: a.Id, name: a.FullyQualifiedName || a.Name }));
    return NextResponse.json({ bank: list(bank), expense: list(expense), saved: Object.fromEntries((saved.data || []).map((r: any) => [r.key,r.value])) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Reconnect QuickBooks to load the company’s real accounts.' }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
    const ctx = await context(request); if (ctx.error) return ctx.error;
    const body = await request.json().catch(() => ({}));
    if (!/^\d{1,30}$/.test(body.bank || '') || !/^\d{1,30}$/.test(body.expense || '')) return NextResponse.json({ error: 'Choose both accounts.' }, { status: 400 });
    const [bank,expense] = await Promise.all([quickBooksRequest(ctx.db,ctx.config!,`account/${body.bank}`),quickBooksRequest(ctx.db,ctx.config!,`account/${body.expense}`)]);
    if (bank.Account?.AccountType !== 'Bank' || expense.Account?.AccountType !== 'Expense' || bank.Account?.Active === false || expense.Account?.Active === false) return NextResponse.json({ error: 'Choose active bank and expense accounts.' }, { status: 400 });
    const { error } = await ctx.db!.from('app_settings').upsert([{ key:'QB_PAYOUT_BANK_ACCOUNT_ID',value:body.bank,updated_at:new Date().toISOString() },{ key:'QB_CONTRACTOR_EXPENSE_ACCOUNT_ID',value:body.expense,updated_at:new Date().toISOString() }],{onConflict:'key'});
    if (error) throw new Error('Save failed');
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'The QuickBooks account mapping could not be verified or saved.' }, { status: 503 }); }
}
