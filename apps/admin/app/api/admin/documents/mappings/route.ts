import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { document_id, field_key, field_value, target_table, target_column, target_row_id } = body;

  if (!document_id || !field_key) return safeError('document_id and field_key required', 400);

  const db = await requireAdminClient();

  const { data: mapping, error } = await db
    .from('document_field_mappings')
    .insert({
      document_id,
      field_key,
      field_value: field_value ?? null,
      target_table: target_table ?? null,
      target_column: target_column ?? null,
      target_row_id: target_row_id ?? null,
      approved: false,
    })
    .select()
    .single();

  if (error) return safeDbError(error, 'Failed to create mapping');

  return NextResponse.json({ mapping });
}

export async function PATCH(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { id, approved, field_value, target_table, target_column } = body;

  if (!id) return safeError('id required', 400);

  const db = await requireAdminClient();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (field_value !== undefined) updates.field_value = field_value;
  if (target_table !== undefined) updates.target_table = target_table;
  if (target_column !== undefined) updates.target_column = target_column;
  if (approved === true) {
    updates.approved = true;
    updates.approved_by = auth.id;
    updates.approved_at = new Date().toISOString();
  }

  const { data: mapping, error } = await db
    .from('document_field_mappings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return safeDbError(error, 'Failed to update mapping');

  return NextResponse.json({ mapping });
}
