// pre-auth-registry: exempt - shared phone handlers verify the signed-in communications owner.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export { POST } from '@/apps/lms/app/api/communications/phone/dial/route';
