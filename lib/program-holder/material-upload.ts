export const MATERIAL_FORMATS = {
  lab_tracker: {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    csv: 'text/csv',
  },
  textbook: {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
} as const;

export function materialUploadPolicy(type: string, file: { name: string; type: string; size: number }) {
  const formats = MATERIAL_FORMATS[type as keyof typeof MATERIAL_FORMATS];
  if (!formats) return null;
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const contentType = (formats as Record<string, string>)[extension];
  const maxBytes = (type === 'textbook' ? 50 : 10) * 1024 * 1024;
  const validMime = !file.type || file.type === 'application/octet-stream' || file.type === contentType ||
    (extension === 'csv' && ['application/vnd.ms-excel', 'text/plain'].includes(file.type));
  return { allowed: Boolean(contentType && validMime && file.size > 0 && file.size <= maxBytes), contentType, maxBytes };
}
