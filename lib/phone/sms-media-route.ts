import { smsMediaGet } from '@/lib/phone/sms-media-api';

/** Shared authenticated SMS media route logic for Admin and LMS origins. */
export type SmsMediaRouteContext = { params: Promise<{ id: string; index: string }> };

export async function getScopedSmsMedia(context: SmsMediaRouteContext) {
  const { id, index } = await context.params;
  return smsMediaGet(id, index);
}
