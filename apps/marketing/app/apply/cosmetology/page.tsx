import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ApplyCosmetologyRedirect() {
  redirect('/partners/host-shop/apply?program=cosmetology');
}
