import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Training Hours | Barber Portal',
  description: 'Track your training hours.',
};

export default function BarberHoursPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Training Hours</h1>
        <p className="text-slate-600">Track your on-the-job training hours.</p>
      </div>
    </div>
  );
}
