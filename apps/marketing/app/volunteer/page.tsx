import { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Users, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Volunteer',
  keywords: ["volunteer", "workforce training", "Indiana"], description: 'Volunteer opportunities to support workforce development.',
};

export default function VolunteerPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Volunteer With Us</h1>
          <p className="text-blue-200">Help us empower individuals through workforce training.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Make a Difference</h2>
          <p className="text-slate-600 mb-6">Volunteers help our students succeed. From tutoring to event support.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow">
              <Users className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="font-bold mb-2">Tutoring</h3>
              <p className="text-slate-600 text-sm">Help students with coursework and test prep.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <Calendar className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="font-bold mb-2">Event Support</h3>
              <p className="text-slate-600 text-sm">Help at graduation and career fairs.</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/contact" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
