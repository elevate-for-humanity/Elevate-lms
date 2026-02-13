import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Core Infrastructure Demo | Elevate for Humanity',
  description: 'See how one person operates intake, enrollment, learning, and credential issuance without staff.',
};

export default function CoreDemoPage() {
  // Redirect to the live interactive demo
  redirect('/store/demo');
}
