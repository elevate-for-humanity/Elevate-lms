export const TRANSFER_HOURS_EVIDENCE_ACCEPT =
  'application/pdf,image/jpeg,image/png,image/webp';
export const TRANSFER_HOURS_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;

export type TransferHoursEvidenceUploadInput = {
  file: File;
  email: string;
  program: string;
  hoursClaimed: number;
};

export type TransferHoursEvidenceUploadResult = {
  ok: true;
  documentId: string;
  linkedApplicationId?: string | null;
};

export async function uploadTransferHoursEvidence({
  file,
  email,
  program,
  hoursClaimed,
}: TransferHoursEvidenceUploadInput): Promise<TransferHoursEvidenceUploadResult> {
  if (!file) throw new Error('Transfer-hours documentation is required.');
  if (!Number.isFinite(hoursClaimed) || hoursClaimed <= 0) {
    throw new Error('Enter the number of transfer hours before uploading documentation.');
  }
  if (file.size > TRANSFER_HOURS_EVIDENCE_MAX_BYTES) {
    throw new Error('Transfer-hours documentation must be 10 MB or smaller.');
  }

  const formData = new FormData();
  formData.set('file', file);
  formData.set('email', email.trim().toLowerCase());
  formData.set('program', program);
  formData.set('hoursClaimed', String(Math.floor(hoursClaimed)));

  const response = await fetch('/api/applications/transfer-hours-document', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    documentId?: string;
    linkedApplicationId?: string | null;
  };

  if (!response.ok || !payload.documentId) {
    throw new Error(payload.error || 'Transfer-hours documentation could not be uploaded.');
  }

  return {
    ok: true,
    documentId: payload.documentId,
    linkedApplicationId: payload.linkedApplicationId ?? null,
  };
}
