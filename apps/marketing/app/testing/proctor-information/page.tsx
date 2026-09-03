import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Testing and Proctor Information',
  description: 'Review testing-center identification, scheduling, check-in, and proctoring policies.',
  robots: { index: false, follow: true },
};

export default function LegacyProctorInformationRedirect() {
  permanentRedirect('/testing/policies');
}
