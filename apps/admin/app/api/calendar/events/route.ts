// pre-auth-registry: exempt - shared handler authenticates and scopes every query to the current user.
export { getCalendarEvents as GET } from '@/lib/calendar/events-route';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
