/** Resolve legacy document uploads without making the private documents bucket public. */
export async function resolveProgramHolderPhoto(
  db: any,
  profile: { id: string; avatar_url?: string | null },
  holderId: string,
): Promise<string | null> {
  const { data, error } = await db
    .from('program_holder_documents')
    .select('file_url,storage_bucket,status,approved')
    .eq('user_id', profile.id)
    .eq('document_type', 'profile_photo')
    .order('created_at', { ascending: false });
  if (error) return profile.avatar_url || null;
  const prefix = `program-holders/${holderId}/profile_photo/`;
  const photo = (data || []).find(
    (row: any) =>
      row.status !== 'rejected' && (row.status === 'approved' || row.approved === true) &&
      row.file_url?.startsWith(prefix) &&
      !row.file_url.slice(prefix.length).includes('/') &&
      !row.file_url.includes('..') &&
      (!row.storage_bucket || row.storage_bucket === 'documents'),
  );
  if (!photo) return profile.avatar_url || null;
  const { data: signed, error: signingError } = await db.storage
    .from('documents')
    .createSignedUrl(photo.file_url, 3600);
  return signingError ? profile.avatar_url || null : signed?.signedUrl || profile.avatar_url || null;
}
