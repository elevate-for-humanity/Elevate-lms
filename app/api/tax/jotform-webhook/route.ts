// PUBLIC ROUTE: tax Jotform webhook compatibility path protected by JOTFORM_WEBHOOK_SECRET.
export const runtime = 'nodejs';
export { POST } from '@/app/api/webhooks/jotform/route';
