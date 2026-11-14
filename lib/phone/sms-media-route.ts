import { smsMediaGet } from '@/lib/phone/sms-media-api';

export type SmsMediaRouteContext = { params: Promise<{ id: string; index: string }> };

/** Single authenticated media implementation for both origin adapters. */
async function getScopedSmsMedia(context: SmsMediaRouteContext) {
  const { id, index } = await context.params;
  return smsMediaGet(id, index);
}

export async function getAdminSmsMedia(_request: Request, context: SmsMediaRouteContext) {
  return getScopedSmsMedia(context);
}

export async function getLearnerSmsMedia(_request: Request, context: SmsMediaRouteContext) {
  return getScopedSmsMedia(context);
}
