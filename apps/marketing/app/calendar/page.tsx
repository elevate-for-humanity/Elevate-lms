import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
export const metadata: Metadata = { title: 'Calendar | Elevate', keywords: ["calendar", "class schedule", "program dates", "Indiana"], description: 'View program dates.' };
export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Academic Calendar</h1>
          <p className="text-blue-200">View program start dates and deadlines.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Calendar className="w-16 h-16 text-brand-blue-600 mx-auto mb-6" />
          <p className="text-slate-600 mb-6">Contact us for current program schedules.</p>
          <Link href="/contact" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}

