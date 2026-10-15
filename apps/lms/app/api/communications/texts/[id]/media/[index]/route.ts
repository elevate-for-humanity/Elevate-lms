// pre-auth-registry: exempt - shared smsMediaGet checks the communication actor and ownership.
export { getLearnerSmsMedia as GET } from '@/lib/phone/sms-media-route';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
