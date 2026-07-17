/** Legacy URL alias — canonical handler: /api/partners/barber-host-shop/apply */

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Re-export only the POST handler
export { POST } from '../../barber-host-shop/apply/route';
