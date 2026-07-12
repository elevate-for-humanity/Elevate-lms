import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Award, MapPin, Clock, DollarSign, ExternalLink, CalendarDays, Briefcase, Phone, CheckCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `ASE Certification Testing | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Prepare for and take ASE automotive certification exams at our authorized testing center. A1-A8 series coverage.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/testing/ase' },
};

const ASE_EXAMS = [
  { code: 'A1', name: 'Engine Repair', desc: 'Covers engine diagnosis, removal, installation, and repair. Includes cylinder head, valve train, engine block, lubrication, and cooling systems.', duration: '60 min', questions: 50 },
  { code: 'A2', name: 'Automatic Transmission', desc: 'Covers diagnosis, adjustment, and repair of automatic transmissions. Includes torque converters, planetary gear sets, clutches, and electronic controls.', duration: '60 min', questions: 50 },
  { code: 'A3', name: 'Manual Drive Train', desc: 'Covers diagnosis and repair of manual transmissions, transaxles, clutches, CV joints, drive shafts, and 4WD/AWD systems.', duration: '45 min', questions: 40 },
  { code: 'A4', name: 'Suspension & Steering', desc: 'Covers steering systems, suspension components, wheel alignment, and related systems. Includes MacPherson strut, rack and pinion, and electronic stability systems.', duration: '45 min', questions: 40 },
  { code: 'A5', name: 'Brakes', desc: 'Covers brake system diagnosis and repair. Includes drum/dish brakes, ABS, parking brakes, and brake fluid systems.', duration: '45 min', questions: 40 },
  { code: 'A6', name: 'Electrical/Electronic Systems', desc: 'Covers vehicle electrical systems including batteries, starting, charging, lighting, and onboard diagnostics.', duration: '60 min', questions: 50 },
  { code: 'A7', name: 'Heating & Air Conditioning', desc: 'Covers HVAC system diagnosis and repair. Includes refrigerants, AC compressors, heating systems, and electronic climate controls.', duration: '45 min', questions: 40 },
  { code: 'A8', name: 'Engine Performance', desc: 'Covers engine performance diagnosis and repair. Includes fuel systems, ignition systems, emissions, and OBD-II diagnostics.', duration: '75 min', questions: 65 },
];

const LEVEL_COLORS: Record<string, string> = {
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
  slate: 'bg-slate-50 border-slate-200 text-slate-900',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
};

export default function ASEPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative flex items-end overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" style={{ minHeight: 'clamp(260px, 45vw, 520px)' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAgTCAwIDIwIEwgMTAgMjAgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmZmYwMDIiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12 w-full text-white">
          <nav className="text-sm text-white/60 mb-4">
            <Link href="/testing" className="hover:text-white transition-colors">Testing Center</Link>
            <span className="mx-2">/</span>
            <span className="text-white">ASE Certification</span>
          </nav>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 bg-brand-red-600/20 text-brand-red-300 border border-brand-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red-400" />
            Available Through Partner
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-3">ASE Certification Testing</h1>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>In-person proctored only — contact for availability</span>
          </div>
        </div>
      </section>

      {/* BODY */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid lg:grid-cols-3 gap-8 lg:gap-10">
        {/* Left — description + exams */}
        <div className="lg:col-span-2 space-y-10">
          {/* About */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">About ASE Certification</h2>
            <p className="text-slate-600 text-base leading-relaxed">
              The National Institute for Automotive Service Excellence (ASE) is the gold standard for automotive technician certification. ASE credentials demonstrate mastery of automotive repair and maintenance skills to employers and customers nationwide.
            </p>
            <p className="text-slate-600 text-base leading-relaxed mt-4">
              Our testing center offers the full A1-A8 series of ASE certifications. Each exam is computer-based and proctored. Passing an ASE exam requires a combination of formal training and hands-on work experience.
            </p>
            <a href="https://www.ase.com/certifications" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-4 text-sm text-blue-600 hover:underline font-medium">
              Official ASE information <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </section>

          {/* Exams available */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Available ASE Exams</h2>
            <div className="space-y-4">
              {ASE_EXAMS.map((exam) => (
                <div key={exam.code} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-red-100 text-brand-red-700 font-bold text-sm mr-2">{exam.code}</span>
                      <h3 className="font-bold text-slate-900 inline">{exam.name}</h3>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm mb-3">{exam.desc}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.duration}</span>
                    <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {exam.questions} questions</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Requirements */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Test Requirements</h2>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <ul className="space-y-3 text-slate-600 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>One year of relevant work experience OR an approved training program</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Valid government-issued photo ID required at check-in</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Arrive 15 minutes early — late arrivals may not be admitted</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>No personal items in testing room — secure storage provided</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-6">
          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4">
              <div className="flex items-center gap-2 text-white">
                <DollarSign className="w-5 h-5" />
                <h3 className="font-bold text-lg">Exam Fee</h3>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-baseline justify-between gap-2 mb-4">
                <span className="text-slate-700 text-sm font-medium">Per certification area</span>
                <span className="text-3xl font-extrabold text-slate-900">$49</span>
              </div>
              <p className="text-slate-500 text-xs">Prices set by ASE — may vary. Contact for group pricing.</p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Link href="/contact" className="flex items-center justify-center gap-2 w-full bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-4 rounded-xl transition-colors">
              <CalendarDays className="w-5 h-5" />
              Schedule Through Partner
            </Link>
            <Link href="/testing" className="flex items-center justify-center w-full border border-slate-200 text-slate-700 font-medium px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm">
              ← All Testing Options
            </Link>
          </div>

          {/* What to bring */}
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
            <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> What to Bring
            </h4>
            <ul className="text-amber-800 text-sm space-y-1.5">
              <li>• Valid government-issued photo ID</li>
              <li>• Confirmation email / booking reference</li>
              <li>• Arrive 15 minutes early</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* BOTTOM CTA */}
      <section className="bg-slate-900 py-12 sm:py-16 px-4 sm:px-6 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-3">Ready to Get ASE Certified?</h2>
        <p className="text-slate-300 mb-8 max-w-xl mx-auto">
          Contact us to schedule your ASE exam. We work with authorized ASE testing partners to deliver exams on-site.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/contact" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-full transition-colors">
            Contact Us
          </Link>
          <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="border border-slate-500 text-white hover:text-white hover:border-white font-bold px-8 py-4 rounded-full transition-colors inline-flex items-center gap-2">
            <Phone className="w-5 h-5" /> Call for Info
          </a>
        </div>
      </section>
    </div>
  );
}
