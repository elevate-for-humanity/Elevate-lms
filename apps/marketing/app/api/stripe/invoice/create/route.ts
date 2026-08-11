export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export { getInvoices as GET, postInvoice as POST } from '@/lib/api/stripe/shared-route-handlers';
