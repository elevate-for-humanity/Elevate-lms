// PUBLIC ROUTE: documented full-pay alias for public barber checkout.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export { POST } from '@/app/api/barber/checkout/public/route';
