import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
};

const FILE_SIGNATURES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'application/msword': [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4b, 0x03, 0x04]],
};

function sanitizeFilename(filename: string): string {
  let s = filename.replace(/[/\\:*?"<>|]/g, '').replace(/\0/g, '');
  s = s.replace(/\.{2,}/g, '.').replace(/^\.+/, '');
  if (s.length > 100) {
    const ext = s.split('.').pop() || '';
    s = ext ? `${s.slice(0, 90)}.${ext}` : s.slice(0, 100);
  }
  return s || 'unnamed';
}

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

async function validateMagicBytes(file: File, mimeType: string): Promise<boolean> {
  const sigs = FILE_SIGNATURES[mimeType];
  if (!sigs) return true;
  const bytes = new Uint8Array(await file.arrayBuffer());
  return sigs.some((sig) => sig.every((b, i) => bytes[i] === b));
}

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return safeError('Authentication required', 401);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = (formData.get('category') as string) || 'admin-documents';

    if (!file) return safeError('No file provided', 400);
    if (file.size > MAX_FILE_SIZE) return safeError('File exceeds 10MB limit', 400);
    if (!ALLOWED_FILE_TYPES[file.type]) {
      return safeError('File type not allowed. Accepted: PDF, DOC, DOCX, JPG, PNG', 400);
    }

    const sanitizedName = sanitizeFilename(file.name);
    const ext = getExtension(sanitizedName);
    if (!ext) return safeError('File must have a valid extension', 400);

    if (!ALLOWED_FILE_TYPES[file.type].includes(ext)) {
      return safeError('File extension does not match file type', 400);
    }

    const contentValid = await validateMagicBytes(file, file.type);
    if (!contentValid) {
      logger.warn('Magic bytes mismatch', { userId: user.id, filename: sanitizedName });
      return safeError('File content does not match declared type', 400);
    }

    const timestamp = Date.now();
    const randomId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const safeExt = ext.replace(/[^a-z0-9]/g, '');
    const storagePath = `${category}/${timestamp}-${randomId}.${safeExt}`;

    const buffer = new Uint8Array(await file.arrayBuffer());
    const { data, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false, cacheControl: '3600' });

    if (uploadError) {
      logger.error('Supabase upload error', uploadError);
      return safeInternalError(uploadError, 'Failed to upload file');
    }

    // Signed URL valid 7 days (documents bucket is private)
    const { data: signedData } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    // Persist record so document center can list and retrieve files
    await supabase.from('documents').insert({
      file_name: sanitizedName,
      file_path: storagePath,
      file_url: signedData?.signedUrl || null,
      mime_type: file.type,
      file_size: file.size,
      file_size_bytes: file.size,
      document_type: category,
      uploaded_by: user.id,
      status: 'active',
    });

    logger.info('Document uploaded', { userId: user.id, path: storagePath, size: file.size });

    return NextResponse.json({
      success: true,
      path: data.path,
      url: signedData?.signedUrl || null,
      name: sanitizedName,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    return safeInternalError(error as Error, 'Upload failed');
  }
}

async function _DELETE(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return safeError('Authentication required', 401);

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      return safeError('Forbidden', 403);
    }

    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get('path');
    if (!storagePath) return safeError('No path provided', 400);
    if (storagePath.includes('..') || storagePath.startsWith('/')) return safeError('Invalid path', 400);

    const { error } = await supabase.storage.from('documents').remove([storagePath]);
    if (error) return safeInternalError(error, 'Failed to delete file');

    await supabase.from('documents').delete().eq('file_path', storagePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    return safeInternalError(error as Error, 'Delete failed');
  }
}

export const POST = withApiAudit('/api/upload', _POST);
export const DELETE = withApiAudit('/api/upload', _DELETE);
