// pre-auth-registry: exempt - twilioSmsWebhook verifies X-Twilio-Signature and the configured account before database access.
import { twilioSmsWebhook } from '@/lib/phone/twilio-sms-webhook';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function POST(request: Request) { return twilioSmsWebhook(request, true); }
