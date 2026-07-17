import { Metadata } from 'next';
import { BarberVideoStudioClient } from './BarberVideoStudioClient';

export const metadata: Metadata = {
  title: 'Barber Video Studio Preview',
  robots: { index: false, follow: false },
};

export default function BarberVideoStudioPreviewPage() {
  return <BarberVideoStudioClient />;
}
