'use server';

import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';

export interface CurriculumUploadInput {
  title: string;
  category: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  public_url: string;
}

async function adminDb() {
  await requireRole(['admin']);
  return requireAdminClient();
}

export async function listCurriculumUploads() {
  const db = await adminDb();
  const { data, error } = await db
    .from('curriculum_uploads')
    .select('id,title,file_name,file_path,file_type,file_size,public_url,category,created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return { records: [], error: 'Curriculum uploads could not load.' };
  return { records: data ?? [], error: null };
}

export async function recordCurriculumUpload(input: CurriculumUploadInput) {
  const db = await adminDb();
  const { error } = await db.from('curriculum_uploads').insert({ ...input, status: 'uploaded' });
  return { error: error ? 'The file uploaded but its record could not be saved.' : null };
}

export async function deleteCurriculumUpload(id: string) {
  const db = await adminDb();
  const { error } = await db.from('curriculum_uploads').delete().eq('id', id);
  return { error: error ? 'The upload record could not be deleted.' : null };
}
