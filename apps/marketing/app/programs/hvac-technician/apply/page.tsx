import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * HVAC is a 6-week program. Keep enrollment on the canonical student intake so
 * duration, credentials, funding, and application data come from the shared
 * program source instead of a second hardcoded HVAC application page.
 */
export default function HvacApplyPage() {
  redirect('/apply/student?program=hvac-technician');
}
