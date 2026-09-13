import { getSecret } from '@/lib/secrets';

const CLIENT_ID_KEYS = ['FACEBOOK_CLIENT_ID', 'FACEBOOK_APP_ID', 'NEXT_PUBLIC_FACEBOOK_APP_ID'] as const;
const CLIENT_SECRET_KEYS = ['FACEBOOK_CLIENT_SECRET', 'FACEBOOK_APP_SECRET'] as const;

async function firstConfigured(keys: readonly string[]) {
  for (const key of keys) {
    const value = (await getSecret(key))?.trim();
    if (value) return { key, value };
  }
  return { key: null, value: '' };
}

/** Resolve both current and legacy production names without exposing values. */
export async function getMetaOAuthConfig() {
  const [clientId, clientSecret, pageId] = await Promise.all([
    firstConfigured(CLIENT_ID_KEYS),
    firstConfigured(CLIENT_SECRET_KEYS),
    firstConfigured(['FACEBOOK_PAGE_ID']),
  ]);

  return { clientId, clientSecret, pageId };
}

