// pre-auth-registry: exempt - canonical handler verifies the signed raw payload.
export { POST } from '@/apps/lms/app/api/webhooks/sendgrid-events/route';
export const runtime = 'nodejs';
