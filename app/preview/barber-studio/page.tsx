import { Metadata } from 'next';
import { BarberVideoStudioClient } from './BarberVideoStudioClient';

export const metadata: Metadata = {
  title: 'Barber Video Studio — Live Preview',
  description: 'Watch barber RTI lesson videos appear as they are generated.',
  robots: { index: false, follow: false },
};

export default function BarberVideoStudioPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <BarberVideoStudioClient />
    </div>
  );
}
