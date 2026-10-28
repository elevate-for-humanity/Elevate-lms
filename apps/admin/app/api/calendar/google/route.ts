// pre-auth-registry: exempt - shared handlers authenticate the current account and isolate its connection.
export { googleCalendarGet as GET, googleCalendarDisconnect as POST } from '@/lib/calendar/google-calendar-routes';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
