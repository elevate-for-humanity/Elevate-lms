import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

const VALID_DOC_TYPES = ['w2', '1099', 'photo_id', 'social_security_card', 'prior_year_return', 'bank_info', 'other'];

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Authentication required', 401);

  const admin = await getAdminClient();
  if (!admin) return safeInternalError(new Error('Admin client unavailable'), 'Service unavailable');

  // Require consent
  const { data: consent } = await admin
    .from('client_consents').select('id').eq('client_id', user.id).limit(1).maybeSingle();
  if (!consent) return safeError('Consent agreement required', 403);

  // Require payment
  const { data: payment } = await admin
    .from('tax_payments').select('id').eq('client_id', user.id).eq('status', 'paid').limit(1).maybeSingle();
  if (!payment) return safeError('Payment required before uploading documents', 403);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return safeError('Invalid form data', 400);
  }

  const file = formData.get('file') as File | null;
  const docType = (formData.get('document_type') as string) || 'other';
  const taxYear = parseInt((formData.get('tax_year') as string) || String(new Date().getFullYear() - 1));

  if (!file) return safeError('No file provided', 400);
  if (!ALLOWED_TYPES.includes(file.type)) return safeError('File type not allowed. Use PDF, JPG, or PNG.', 400);
  if (file.size > MAX_SIZE) return safeError('File exceeds 25MB limit', 400);
  if (!VALID_DOC_TYPES.includes(docType)) return safeError('Invalid document type', 400);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `tax-docs/${user.id}/${taxYear}/${docType}_${Date.now()}_${safeName}`;

  // Upload to Supabase storage
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) return safeInternalError(uploadError, 'File upload failed');

  // Get public URL
  const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

  // Write record to tax_documents
  const { data: doc, error: dbError } = await admin
    .from('tax_documents')
    .insert({
      user_id: user.id,
      uploaded_by: user.id,
      tax_year: taxYear,
      document_type: docType,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      file_url: publicUrl,
      status: 'pending_review',
      metadata: { file_path: filePath, uploaded_at: new Date().toISOString() },
    })
    .select('id, document_type, file_name, file_size, status, created_at')
    .single();

  if (dbError) {
    // Clean up orphaned file
    await supabase.storage.from('documents').remove([filePath]);
    return safeInternalError(dbError, 'Failed to save document record');
  }

  return NextResponse.json({ ok: true, document: doc });
}

// List this user's uploaded documents
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Authentication required', 401);

  const admin = await getAdminClient();
  if (!admin) return safeInternalError(new Error('Admin client unavailable'), 'Service unavailable');

  const { data, error } = await admin
    .from('tax_documents')
    .select('id, document_type, file_name, file_size, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return safeInternalError(error, 'Failed to fetch documents');

  return NextResponse.json({ documents: data ?? [] });
}
