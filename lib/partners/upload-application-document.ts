import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

/**
 * Upload base64 data-URL file payload to Supabase `documents` bucket.
 */
export async function uploadApplicationDocument(
  supabase: SupabaseClient,
  prefix: string,
  contactEmail: string,
  fileData: string,
  fileName: string,
): Promise<string | null> {
  if (!fileData || !fileName) return null;
  try {
    const base64Data = fileData.split(',')[1];
    const mimeType = fileData.split(';')[0].replace('data:', '');
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = fileName.split('.').pop() || 'pdf';
    const storagePath = `${prefix}/${Date.now()}-${contactEmail.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false });
    if (uploadError) {
      logger.error(`Upload failed (${prefix})`, uploadError);
      return null;
    }
    return storagePath;
  } catch (err) {
    logger.error(`Upload error (${prefix})`, err as Error);
    return null;
  }
}
