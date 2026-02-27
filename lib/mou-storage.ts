import { createBrowserClient } from '@supabase/ssr';
import { logger } from '@/lib/logger';

/**
 * Get a signed URL for downloading a signed MOU from storage
 * @param filename - The filename stored in program_holders.signed_mou_url
 * @returns Public URL for downloading the signed MOU
 */
export async function getSignedMOUUrl(
  filename: string
): Promise<string | null> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error }: any = await supabase.storage
    .from('mous')
    .createSignedUrl(filename, 60); // 60-second expiry for compliance documents

  if (error) {
    logger.error('Error creating signed URL', error as Error, { filename });
    return null;
  }

  return data.signedUrl;
}

/**
 * Download a signed MOU file
 * @param filename - The filename stored in program_holders.signed_mou_url
 * @returns Blob of the PDF file
 */
export async function downloadSignedMOU(
  filename: string
): Promise<Blob | null> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error }: any = await supabase.storage
    .from('mous')
    .download(filename);

  if (error) {
    logger.error('Error downloading MOU', error as Error, { filename });
    return null;
  }

  return data;
}

/**
 * Check if a signed MOU exists in storage
 * @param filename - The filename to check
 * @returns Boolean indicating if file exists
 */
export async function signedMOUExists(filename: string): Promise<boolean> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error }: any = await supabase.storage.from('mous').list('', {
    search: filename,
  });

  if (error) {
    logger.error('Error checking MOU existence', error as Error, { filename });
    return false;
  }

  return data.length > 0;
}
