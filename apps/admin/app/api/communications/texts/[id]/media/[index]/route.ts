// pre-auth-registry: exempt - smsMediaGet verifies the communication actor and scopes message reads to its system and owner.
import { smsMediaGet } from '@/lib/phone/sms-media-api';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ id: string; index: string }> }) {
  const { id, index } = await context.params;
  return smsMediaGet(id, index);
}
