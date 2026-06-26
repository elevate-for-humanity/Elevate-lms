/**
 * POST /api/apprentice/documents — Apprentice document upload
 * 
 * Authenticated apprentice uploads documents (ID, SS card, diploma, etc.)
 * Files go to Supabase Storage (apprentice-uploads bucket) + documents table.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'apprentice-uploads';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/jpeg',
  'image/jpeg',
  'image/png',
]);

export async function POST(request: NextRequest) {
  // Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'File type not allowed. Use PDF, JPG, or PNG.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 });
  }

  const documentType = (formData.get('document_type') as string | null) ?? 'general';
  
  // Sanitise document type
  const safeType = documentType.replace(/[^a-z0-9-_]/gi, '').toLowerCase();

  const ext = file.name.split('.').pop() ?? 'bin';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${user.id}/${Date.now()}-${safeName}`;

  const db = await createAdminClient();

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    // If bucket doesn't exist, try using main documents bucket
    const { error: fallbackError } = await db.storage
      .from('documents')
      .upload(`apprentice/${path}`, buffer, { contentType: file.type, upsert: false });
    
    if (fallbackError) {
      return NextResponse.json(safeError(fallbackError), { status: 500 });
    }
    
    const { data: urlData } = db.storage.from('documents').getPublicUrl(`apprentice/${path}`);
    
    // Record in documents table
    const { data: docRow, error: insertError } = await db
      .from('documents')
      .insert({
        file_name: file.name,
        file_path: `apprentice/${path}`,
        file_url: urlData.publicUrl,
        mime_type: file.type,
        file_size_bytes: file.size,
        document_type: safeType,
        status: 'pending',
        user_id: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json(safeError(insertError), { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      id: docRow?.id,
      url: urlData.publicUrl,
      path: `apprentice/${path}`
    });
  }

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);

  // Record in documents table
  const { data: docRow, error: insertError } = await db
    .from('documents')
    .insert({
      file_name: file.name,
      file_path: path,
      file_url: urlData.publicUrl,
      mime_type: file.type,
      file_size_bytes: file.size,
      document_type: safeType,
      status: 'pending',
      user_id: user.id,
    })
    .select('id')
    .single();

  if (insertError) {
    return NextResponse.json(safeError(insertError), { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    id: docRow?.id,
    url: urlData.publicUrl,
    path
  });
}
