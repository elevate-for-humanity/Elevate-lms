import { Buffer } from 'node:buffer';

const TYPES: Record<string, { extension: string; signature: (bytes: Buffer) => boolean }> = {
  'application/pdf': { extension: 'pdf', signature: b => b.subarray(0, 5).toString() === '%PDF-' },
  'image/jpeg': { extension: 'jpg', signature: b => b[0] === 255 && b[1] === 216 && b[2] === 255 },
  'image/png': { extension: 'png', signature: b => b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) },
  'image/webp': { extension: 'webp', signature: b => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
  'application/msword': { extension: 'doc', signature: b => b.subarray(0, 8).equals(Buffer.from([208,207,17,224,161,177,26,225])) },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extension: 'docx', signature: b => b[0] === 80 && b[1] === 75 && b.includes(Buffer.from('word/document.xml')),
  },
};

export async function validateDocument(file: File, kind: 'credential' | 'resume') {
  if (!file.size || file.size > 10 * 1024 * 1024) return { error: 'Choose a nonempty file up to 10 MB.' };
  const type = TYPES[file.type];
  const allowed = kind === 'resume' ? ['pdf', 'doc', 'docx'] : ['pdf', 'jpg', 'png', 'webp'];
  if (!type || !allowed.includes(type.extension)) return { error: kind === 'resume' ? 'Use a PDF or Word resume.' : 'Use a PDF, JPG, PNG, or WebP credential.' };
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!type.signature(bytes)) return { error: 'The file contents do not match the selected document type.' };
  return { extension: type.extension, bytes };
}
