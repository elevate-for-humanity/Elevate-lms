export const dynamic = 'force-dynamic';
/**
 *  application — archived.
 *
 * FSSA-funded enrollment is handled through WorkOne case managers.
 * Direct online applications are not accepted. Students with FSSA/TANF
 * benefits should contact their case manager or join the waitlist.
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function FssaApplyPage() {
  redirect('/apply/fssa/waitlist');
}
