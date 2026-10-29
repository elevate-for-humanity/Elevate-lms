export type DocumentReview = {
  document_type?: string | null;
  status?: string | null;
  approved?: boolean | null;
};

export type UploadedW9Status = 'approved' | 'pending' | 'rejected' | 'missing';

/** Explicit review state wins over a stale legacy approval flag. */
export function isApprovedDocument(document: DocumentReview): boolean {
  const status = document.status?.trim().toLowerCase();
  return status ? status === 'approved' : document.approved === true;
}

export function uploadedW9Status(documents: DocumentReview[]): UploadedW9Status {
  const records = documents.filter(document => document.document_type === 'w9');
  if (records.some(isApprovedDocument)) return 'approved';
  if (!records.length) return 'missing';
  return records.every(document => document.status?.trim().toLowerCase() === 'rejected')
    ? 'rejected' : 'pending';
}

/** Returns review metadata only, never the tax form, tax ID, or storage URL. */
export async function getUploadedW9Status(db: {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => PromiseLike<{
        data: DocumentReview[] | null; error: unknown;
      }>;
    };
  };
}, userId: string): Promise<UploadedW9Status> {
  const { data, error } = await db.from('program_holder_documents')
    .select('document_type,status,approved').eq('user_id', userId);
  if (error) throw new Error('Uploaded W-9 review could not be verified.');
  return uploadedW9Status(data || []);
}
