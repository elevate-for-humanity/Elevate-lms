// pre-auth-registry: exempt - smsGet/smsPost verify actor, workspace ownership, and preview read-only state.
export { smsGet as GET, smsPost as POST } from '@/lib/phone/sms-api';
export const dynamic = 'force-dynamic';
