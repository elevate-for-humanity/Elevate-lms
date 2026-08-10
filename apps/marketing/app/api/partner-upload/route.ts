import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const MAX_SIZE = 10 * 1024 * 1024;

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const partnerId = String(form.get('partnerId') || '');
  const token = String(form.get('token') || '');
  const documentType = String(form.get('documentType') || '');
  const file = form.get('file');

  if (!partnerId || !token || !documentType || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing upload information.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Upload a PDF, JPG, or PNG file.' }, { status: 415 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be 10 MB or smaller.' }, { status: 413 });
  }

  const supabase = await requireAdminClient();
  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('id, state, program_type')
    .eq('id', partnerId)
    .eq('onboarding_step', token)
    .maybeSingle();

  if (partnerError || !partner) {
    return NextResponse.json({ error: 'This upload link is invalid or expired.' }, { status: 404 });
  }

  const path = `token/${partnerId}/${Date.now()}-${safeName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from('partner-documents')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: insertError } = await supabase.from('partner_documents').insert({
    partner_id: partnerId,
    document_type: documentType,
    display_name: file.name,
    file_name: file.name,
    file_url: path,
    storage_bucket: 'partner-documents',
    file_type: file.type,
    file_size: file.size,
    program_id: partner.program_type || null,
    state: partner.state || null,
    status: 'pending',
  });

  if (insertError) {
    await supabase.storage.from('partner-documents').remove([path]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
