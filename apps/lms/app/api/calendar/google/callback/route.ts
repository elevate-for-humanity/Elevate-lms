// pre-auth-registry: exempt - shared OAuth handler validates authentication and account-bound state.
export { googleCalendarCallback as GET } from '@/lib/calendar/google-calendar-routes';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
