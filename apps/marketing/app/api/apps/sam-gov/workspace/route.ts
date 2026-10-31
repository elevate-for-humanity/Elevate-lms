import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireIndividualWorkspace, workspaceFailure } from '@/lib/apps/workspaces/access';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const uuid = z.string().uuid();
const entity = z.object({
  entity_id: uuid.nullable().optional(),
  legal_business_name: z.string().trim().min(2).max(200),
  uei: z
    .string()
    .trim()
    .regex(/^([A-Z0-9]{12})?$/),
  cage_code: z
    .string()
    .trim()
    .regex(/^([A-Z0-9]{5})?$/),
  registration_status: z.enum(['draft', 'in_progress', 'submitted', 'active', 'expired']),
  registration_expires_on: z
    .string()
    .refine(
      (v) =>
        !v ||
        (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
          Number.isFinite(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v),
    ),
  notes: z.string().max(4000),
});
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const access = await requireIndividualWorkspace(request, 'sam-gov');
  if (access instanceof NextResponse) return access;
  const parsed = uuid.safeParse(request.nextUrl.searchParams.get('document'));
  if (!parsed.success)
    return NextResponse.json({ error: 'Document ID is required.' }, { status: 400 });
  const row = await access.db
    .from('sam_documents')
    .select('storage_path')
    .eq('id', parsed.data)
    .eq('user_id', access.userId)
    .maybeSingle();
  if (row.error) return workspaceFailure(row.error);
  if (!row.data?.storage_path)
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  const signed = await access.db.storage
    .from('app-workspace-files')
    .createSignedUrl(row.data.storage_path, 60, { download: true });
  if (signed.error || !signed.data?.signedUrl) return workspaceFailure(signed.error);
  return NextResponse.redirect(signed.data.signedUrl);
}
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const access = await requireIndividualWorkspace(request, 'sam-gov');
  if (access instanceof NextResponse) return access;
  try {
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const form = await request.formData();
      const entityId = uuid.safeParse(form.get('entity_id'));
      const file = form.get('file');
      const allowed = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (
        !entityId.success ||
        !(file instanceof File) ||
        file.size === 0 ||
        file.size > 10485760 ||
        !allowed.includes(file.type)
      )
        return NextResponse.json(
          { error: 'Select an entity and a PDF, image, or Word document up to 10 MB.' },
          { status: 400 },
        );
      const owned = await access.db
        .from('sam_entities')
        .select('id')
        .eq('id', entityId.data)
        .eq('user_id', access.userId)
        .maybeSingle();
      if (owned.error) throw owned.error;
      if (!owned.data) return NextResponse.json({ error: 'Entity not found.' }, { status: 404 });
      const path = `${access.userId}/sam/${entityId.data}/${crypto.randomUUID()}`;
      const bucket = access.db.storage.from('app-workspace-files');
      const uploaded = await bucket.upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: false,
      });
      if (uploaded.error) throw uploaded.error;
      const saved = await access.db.from('sam_documents').insert({
        user_id: access.userId,
        entity_id: entityId.data,
        file_name: file.name.slice(0, 200),
        file_size: file.size,
        storage_path: path,
        document_type: file.type,
      });
      if (saved.error) {
        await bucket.remove([path]);
        throw saved.error;
      }
      return NextResponse.json({ ok: true });
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return NextResponse.json({ error: 'A valid request body is required.' }, { status: 400 });
    if (body.action === 'read-alert') {
      const id = uuid.safeParse(body.id);
      if (!id.success) return NextResponse.json({ error: 'Invalid reminder.' }, { status: 400 });
      const updated = await access.db
        .from('sam_alerts')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', id.data)
        .eq('user_id', access.userId)
        .select('id')
        .maybeSingle();
      if (updated.error) throw updated.error;
      if (!updated.data)
        return NextResponse.json({ error: 'Reminder not found.' }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    const parsed = entity.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Check the entity name, UEI, CAGE code, status, and renewal date.' },
        { status: 400 },
      );
    const { entity_id, ...values } = parsed.data;
    const saved = await access.db.rpc('save_sam_entity', {
      p_user_id: access.userId,
      p_entity_id: entity_id ?? null,
      p_values: values,
    });
    if (saved.error) throw saved.error;
    return NextResponse.json({ ok: true, entity: saved.data });
  } catch (error) {
    return workspaceFailure(error);
  }
}
