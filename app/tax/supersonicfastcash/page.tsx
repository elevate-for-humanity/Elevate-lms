import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title:
    'SupersonicFastCash - Professional Tax Preparation | Elevate for Humanity',
  description:
    'Fast, professional tax preparation with refund advances up to $7,500. Same-day service available in Indianapolis.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/tax/supersonicfastcash',
  },
};

export default function SupersonicFastCashPage() {
  redirect('/supersonic-fast-cash');
}
