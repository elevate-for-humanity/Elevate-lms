import 'server-only';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/** Normal profile work and email callbacks cannot spend the mail-send budget. */
export function applyProviderRequestLimit(request: Request, purpose: 'profile' | 'callback') {
  return purpose === 'profile'
    ? applyRateLimit(request, 'api', undefined, 'cleaning-provider-profile')
    : applyRateLimit(request, 'auth', undefined, 'cleaning-provider-callback');
}

/** The identity comes only from verifiedProviderSession, never a request field. */
export async function applyProviderEmailSendLimit(request: Request, verifiedUserId: string) {
  const visitorLimit = await applyRateLimit(request, 'contact', undefined, 'cleaning-provider-email');
  if (visitorLimit) return visitorLimit;
  return applyRateLimit(request, 'contact', { key: verifiedUserId }, 'cleaning-provider-email');
}
