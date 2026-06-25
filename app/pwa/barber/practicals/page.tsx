import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Practical Training | Barber Portal',
  description: 'Barber practical training exercises.',
};

export default function BarberPracticalsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Practical Training</h1>
        <p className="text-slate-600">Complete your practical training exercises.</p>
      </div>
    </div>
  );
}
