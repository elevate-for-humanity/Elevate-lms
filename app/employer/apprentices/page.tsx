import { Metadata } from 'next';
import Link from 'next/link';
import { Users, Award, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apprenticeship Programs | Employer Portal',
  description: 'Partner with us for DOL-registered apprenticeship programs.',
};

export default function EmployerApprenticesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-purple-900 to-purple-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Apprenticeship Programs</h1>
          <p className="text-purple-200">Build your talent pipeline with earn-while-you-learn apprenticeships.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-2">Barber Apprenticeship</h3>
              <p className="text-slate-600 text-sm mb-4">Train future barbers. DOL-registered, 12-18 months.</p>
              <Link href="/employer/register" className="text-purple-600 font-semibold hover:underline">Learn More →</Link>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-2">Cosmetology Apprenticeship</h3>
              <p className="text-slate-600 text-sm mb-4">Develop skilled stylists. State licensed.</p>
              <Link href="/employer/register" className="text-purple-600 font-semibold hover:underline">Learn More →</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

