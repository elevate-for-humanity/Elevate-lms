// PUBLIC ROUTE: Re-export only — auth enforced in /api/supervisor/verify-rep
// Partner-friendly alias for verifying competency reps (shares the supervisor handler).
export { POST } from '@/app/api/supervisor/verify-rep/route';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
