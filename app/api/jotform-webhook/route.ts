// PUBLIC ROUTE: legacy Jotform webhook URL protected by JOTFORM_WEBHOOK_SECRET in canonical handler.
export const runtime = 'nodejs';
export { POST } from '@/app/api/webhooks/jotform/route';
