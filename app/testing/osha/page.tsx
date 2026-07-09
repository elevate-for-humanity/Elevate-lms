import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config`;

export const metadata: Metadata = {
  title: `OSHA Safety Training | ${PLATFORM_DEFAULTS.orgName}`,
  description: `OSHA safety training and certification at our testing center.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/testing/osha' },
};

export default function OSHAPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-slate-900 via-brand-blue-900 to-slate-900 text-white py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-600/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Shield className="w-4 h-4" /> OSHA Approved
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">OSHA Safety Training</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">Get OSHA safety certification at our testing center.</p>
          <Link href="/testing/book" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">Book Your Test</Link>
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
