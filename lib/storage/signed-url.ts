import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_EXPIRY = 3600; // 1 hour

/**
 * Generate a signed URL for a file in a private Supabase storage bucket.
 * Falls back to the raw path if signing fails (e.g. bucket doesn't exist).
 */
export async function getSignedDocumentUrl(
  filePath: string,
  bucket: string = 'documents',
  expiresIn: number = DEFAULT_EXPIRY,
): Promise<string | null> {
  if (!filePath) return null;

  const admin = createAdminClient();
  const supabase = admin || (await createClient());
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
