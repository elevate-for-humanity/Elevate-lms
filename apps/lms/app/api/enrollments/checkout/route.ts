/**
 * @deprecated Compatibility alias.
 * Canonical partner-course payment route: /api/checkout/partner-course
 */
import { POST as canonicalPartnerCourseCheckout } from '../../checkout/partner-course/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = canonicalPartnerCourseCheckout;
