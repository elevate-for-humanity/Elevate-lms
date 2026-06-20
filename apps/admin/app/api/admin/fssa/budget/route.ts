import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { searchParams } = new URL(request.url);
  const fiscalYear = searchParams.get('fiscal_year');
  const quarter = searchParams.get('quarter');

  let query = db
    .from('fssa_budget')
    .select('id, fiscal_year, quarter, category, line_item, budgeted_amount, expended_amount, encumbered, notes, created_at')
    .order('fiscal_year', { ascending: false })
    .order('category');

  if (fiscalYear) query = query.eq('fiscal_year', fiscalYear);
  if (quarter) query = query.eq('quarter', quarter);

  const { data, error } = await query;
  if (error) return safeDbError(error, 'Failed to fetch FSSA budget');

  const rows = data ?? [];

  // Compute summary totals
  const summary = {
    total_budgeted: rows.reduce((s, r) => s + (r.budgeted_amount ?? 0), 0),
    total_expended: rows.reduce((s, r) => s + (r.expended_amount ?? 0), 0),
    total_encumbered: rows.reduce((s, r) => s + (r.encumbered ?? 0), 0),
    // 50% SNAP E&T reimbursement estimate on expended
    estimated_reimbursement: rows.reduce((s, r) => s + (r.expended_amount ?? 0), 0) * 0.5,
  };

  return NextResponse.json({ budget: rows, summary });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.fiscal_year || !body?.category || !body?.line_item) {
    return safeError('fiscal_year, category, and line_item are required', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('fssa_budget')
    .insert({
      fiscal_year: body.fiscal_year,
      quarter: body.quarter ?? null,
      category: body.category,
      line_item: body.line_item,
      budgeted_amount: parseFloat(body.budgeted_amount ?? 0),
      expended_amount: parseFloat(body.expended_amount ?? 0),
      encumbered: parseFloat(body.encumbered ?? 0),
      notes: body.notes ?? null,
      entered_by: auth.id,
    })
    .select('id')
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to create budget line');
  return NextResponse.json({ success: true, id: data?.id });
}

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.id) return safeError('id is required', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const allowed = ['budgeted_amount', 'expended_amount', 'encumbered', 'notes', 'quarter'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) return safeError('No valid fields to update', 400);

  const { error } = await db
    .from('fssa_budget')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', body.id);

  if (error) return safeDbError(error, 'Failed to update budget line');
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return safeError('id is required', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { error } = await db.from('fssa_budget').delete().eq('id', id);
  if (error) return safeDbError(error, 'Failed to delete budget line');

  return NextResponse.json({ success: true });
}
