// pre-auth-registry: exempt - shared getScopedSmsMedia verifies actor and media ownership.
import { getScopedSmsMedia, type SmsMediaRouteContext } from '@/lib/phone/sms-media-route';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: SmsMediaRouteContext) {
  return getScopedSmsMedia(context);
}
