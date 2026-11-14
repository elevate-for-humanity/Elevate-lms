import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
function key(explicitKey?: string) {
  const raw = explicitKey ?? process.env.TAX_DATA_ENCRYPTION_KEY ?? process.env.SSN_ENCRYPTION_KEY;
  if (!raw || !/^([a-f0-9]{2}){32}$/i.test(raw))
    throw new Error('Tax data encryption is not configured');
  return Buffer.from(raw, 'hex');
}
const context = (userId: string, returnId: string) =>
  Buffer.from(JSON.stringify({ purpose: 'tax-return-private-fields-v1', userId, returnId }));
export function sealTaxPrivateFields(
  value: unknown,
  userId: string,
  returnId: string,
  encryptionKey?: string,
) {
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', key(encryptionKey), iv);
  cipher.setAAD(context(userId, returnId));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [
    'v1',
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}
export function openTaxPrivateFields<T>(
  envelope: string,
  userId: string,
  returnId: string,
  encryptionKey?: string,
): T {
  const [version, iv, tag, encrypted, ...rest] = envelope.split('.');
  if (version !== 'v1' || rest.length || !iv || !tag || !encrypted)
    throw new Error('Invalid private return data');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key(encryptionKey),
    Buffer.from(iv, 'base64url'),
  );
  decipher.setAAD(context(userId, returnId));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64url')),
      decipher.final(),
    ]).toString('utf8'),
  );
}
