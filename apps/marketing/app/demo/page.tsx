import { redirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Request a Demo | Elevate for Humanity',
};

export default function DemoPage() {
  redirect('/demos');
}
