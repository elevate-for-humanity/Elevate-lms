/**
 * POST /api/admin/contracts/upload
 *
 * Accepts multipart/form-data with:
 *   file        — the contract/template file
 *   title       — human-readable title
 *   agency_name — issuing agency
 *   source_type — state_contract | grant_application | mou | rfp | rfq | compliance_form | other
 *
 * Stores file in private 'contracts' Supabase Storage bucket.
 * Creates contract_templates row with status='uploaded'.
 * Audits the upload.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { hydrateProcessEnv } from '@/lib/secrets';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACCEPTED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]);

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  await hydrateProcessEnv();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return safeError('Invalid form data', 400);
  }

  const file = formData.get('file') as File | null;
  if (!file) return safeError('file is required', 400);
  if (!ACCEPTED_MIME.has(file.type)) return safeError(`Unsupported file type: ${file.type}`, 400);
  if (file.size > MAX_SIZE) return safeError('File exceeds 50 MB limit', 400);

  const title = (formData.get('title') as string)?.trim() || file.name;
  const agency_name = (formData.get('agency_name') as string)?.trim() || null;
  const source_type = (formData.get('source_type') as string)?.trim() || 'state_contract';

  const db = await requireAdminClient();
  const storage = db;

  // Upload to private contracts bucket
  const timestamp = Date.now();
  const filePath = `templates/${timestamp}-${safeName(file.name)}`;
  const arrayBuf = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  const { error: storageErr } = await storage.storage
    .from('contracts')
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (storageErr) return safeInternalError(storageErr, 'Storage upload failed');

  // Create DB record
  const { data: template, error: dbErr } = await db
    .from('contract_templates')
    .insert({
      title,
      agency_name,
      source_type,
      original_file_path: filePath,
      file_type: file.type,
      file_name: file.name,
      file_size: file.size,
      status: 'uploaded',
      created_by: auth.id ?? null,
    })
    .select('id, title, status, created_at')
    .single();

  if (dbErr || !template) return safeInternalError(dbErr, 'Failed to create contract record');

  // Audit
  await db.from('contract_audit_logs').insert({
    actor_id: auth.id ?? null,
    action: 'upload',
    entity_type: 'contract_template',
    entity_id: template.id,
    after_json: { title, agency_name, source_type, file_name: file.name, file_size: file.size },
    ip_address: request.headers.get('x-forwarded-for') ?? null,
  });

  return NextResponse.json({ ok: true, template });
}
