/** Legacy URL alias — canonical handler: /api/partners/barber-host-shop/apply */
// PUBLIC ROUTE: barbershop apprenticeship application alias kept for legacy forms.
// Next.js requires segment config exports to be statically analyzable from this file;
// do not re-export runtime/dynamic/maxDuration from the canonical route.
export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export { POST } from '../../barber-host-shop/apply/route';
