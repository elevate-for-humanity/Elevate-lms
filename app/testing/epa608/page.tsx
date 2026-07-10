import type { Metadata } from 'next';
import Link from 'next/link';
import { Wind, CheckCircle, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `EPA 608 Technician Certification | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Get your EPA 608 refrigerant handling certification at our testing center.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/testing/epa608' },
};

const types = ['Core', 'Type I - Small Appliances', 'Type II - High Pressure', 'Type III - Low Pressure', 'Universal'];

export default function EPA608Page() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-slate-900 via-brand-blue-900 to-slate-900 text-white py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-600/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Wind className="w-4 h-4" /> EPA Approved
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">EPA 608 Certification</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">Get certified to handle refrigerants under EPA Section 608.</p>
          <Link href="/testing/book" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">Book Your Test</Link>
        </div>
      </section>
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Available Certifications</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {types.map((t) => (
              <div key={t} className="bg-white rounded-lg p-5 border border-slate-200 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-brand-red-600" />
                <span className="font-medium text-slate-700">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-white text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-8">Ready to Schedule?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/testing/book" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">Book Now</Link>
          <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-8 py-4 rounded-xl transition-colors text-lg inline-flex items-center gap-2">
            <Phone className="w-5 h-5" /> Call
          </a>
        </div>
      </section>
    </div>
  );
}
