import type { Metadata } from 'next';
import Link from 'next/link';
import { Stethoscope, CheckCircle, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `NHA Certification Testing | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Prepare for and take NHA healthcare certification exams at our testing center.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/testing/nha' },
};

const certs = ['CPhT - Pharmacy Technician', 'CCMA - Clinical Medical Assistant', 'CPT - Phlebotomy Technician', 'PCT - Patient Care Technician', 'RHIT - Registered Health Information Technician'];

export default function NHAPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-slate-900 via-brand-blue-900 to-slate-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAgTCAwIDIwIEwgMTAgMjAgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmZmYwMDIiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-600/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Stethoscope className="w-4 h-4" /> NHA Certifications
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">NHA Healthcare Certifications</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">Get certified in healthcare through NHA at our testing center.</p>
          <Link href="/testing/book" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">Book Your Test</Link>
        </div>
      </section>
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Available NHA Certifications</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certs.map((cert) => (
              <div key={cert} className="bg-white rounded-lg p-5 border border-slate-200 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0" />
                <span className="font-medium text-slate-700">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-white text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-8">Ready to Get Certified?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/testing/book" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">Book Now</Link>
          <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-8 py-4 rounded-xl transition-colors text-lg inline-flex items-center justify-center gap-2">
            <Phone className="w-5 h-5" /> Call for Info
          </a>
        </div>
      </section>
    </div>
  );
}
