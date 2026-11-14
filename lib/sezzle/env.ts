/**
 * Sezzle environment config helper.
 *
 * Resolution order for public key:
 *   API_KEYS_JSON["SEZZLE_PUBLIC_KEY"] → SEZZLE_PUBLIC_KEY → NEXT_PUBLIC_SEZZLE_PUBLIC_KEY
 *
 * Private key is server-only — never exposed to the client bundle.
 */

let _apiKeys: Record<string, string> = {};
try {
  const raw = process.env.API_KEYS_JSON;
  if (raw) _apiKeys = JSON.parse(raw);
} catch {
  /* invalid JSON — fall through */
}

export function getSezzleConfig() {
  const publicKey =
    _apiKeys['SEZZLE_PUBLIC_KEY'] ||
    process.env.SEZZLE_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_SEZZLE_PUBLIC_KEY ||
    '';

  const privateKey =
    _apiKeys['SEZZLE_PRIVATE_KEY'] ||
    process.env.SEZZLE_PRIVATE_KEY ||
    '';

  const merchantId = process.env.NEXT_PUBLIC_SEZZLE_MERCHANT_ID || '';
  const environment =
    (process.env.NEXT_PUBLIC_SEZZLE_ENVIRONMENT as 'sandbox' | 'production') || 'production';

  return {
    publicKey,
    privateKey,
    merchantId,
    environment,
    configured: Boolean(publicKey && privateKey),
  };
}
