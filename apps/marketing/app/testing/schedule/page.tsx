import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Schedule a Testing Session',
  description: 'Schedule a credential testing appointment with Elevate for Humanity.',
  robots: { index: false, follow: true },
};

export default function LegacyTestingScheduleRedirect() {
  permanentRedirect('/testing/book');
}
