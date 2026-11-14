import { createPublicKey, createVerify } from 'node:crypto';

type Verification = { verified: true } | { verified: false; status: 401 | 503 };

/** Verify the original multipart bytes before the parser consumes the body. */
export async function verifySendGridInboundRequest(
  request: Request,
  publicKey: string | undefined,
): Promise<Verification> {
  if (!publicKey) return { verified: false, status: 503 };
  let key;
  try {
    key = publicKey.includes('-----BEGIN PUBLIC KEY-----')
      ? createPublicKey(publicKey.replace(/\\n/g, '\n'))
      : createPublicKey({ key: Buffer.from(publicKey, 'base64'), format: 'der', type: 'spki' });
  } catch {
    return { verified: false, status: 503 };
  }
  const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp') || '';
  const signature = request.headers.get('x-twilio-email-event-webhook-signature') || '';
  if (!/^\d+$/.test(timestamp) || !signature) return { verified: false, status: 401 };
  try {
    const verifier = createVerify('sha256');
    verifier.update(timestamp);
    verifier.update(Buffer.from(await request.clone().arrayBuffer()));
    verifier.end();
    return verifier.verify(key, signature, 'base64')
      ? { verified: true }
      : { verified: false, status: 401 };
  } catch {
    return { verified: false, status: 401 };
  }
}
