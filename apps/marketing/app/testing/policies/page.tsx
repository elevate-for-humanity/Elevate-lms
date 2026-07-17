import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle, Clock, AlertTriangle, Shield, Calendar } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Testing Policies | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Testing center policies, procedures, and requirements. Read before booking your exam.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/testing/policies' },
};

const POLICIES = [
  {
    icon: CheckCircle,
    title: 'ID Requirements',
    items: [
      'Valid government-issued photo ID required (driver\'s license, state ID, passport, or military ID)',
      'Name on ID must match the name on your exam registration',
      'Expired IDs will not be accepted',
      'Second form of ID may be requested for certain exams',
    ],
  },
  {
    icon: Calendar,
    title: 'Scheduling & Rescheduling',
    items: [
      'All exams require an appointment — walk-ins are not accepted',
      'Reschedule with at least 24 hours notice at no charge',
      'Rescheduling within 24 hours may result in a rescheduling fee',
      'Same-day appointments may be available — call to check capacity',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'No-Show & Cancellation Policy',
    items: [
      'No-shows forfeit their exam fee — no refunds issued',
      'Cancellations within 24 hours are treated as no-shows',
      'Medical emergencies: contact us within 48 hours with documentation',
      'Technical issues: contact us immediately to reschedule',
    ],
  },
  {
    icon: Shield,
    title: 'Testing Rules',
    items: [
      'No personal items in the testing room — secure storage provided',
      'Cell phones and smartwatches must be powered off',
      'No notes, books, or external references unless permitted',
      'Calculators permitted only for exams that allow them',
      'No talking or communication with other test-takers',
      'Proctors may dismiss test-takers for rule violations',
    ],
  },
  {
    icon: Clock,
    title: 'Arrival & Check-In',
    items: [
      'Arrive 15 minutes before your scheduled exam time',
      'Late arrivals may not be admitted — no refunds for late arrivals',
      'Check-in includes identity verification and palm scan/photo',
      'Break policy varies by exam — check with proctor before starting',
    ],
  },
  {
    icon: FileText,
    title: 'Results & Certificates',
    items: [
      'Most exams provide immediate results upon completion',
      'Digital certificates typically issued within 24-48 hours of passing',
      'Physical certificates may be mailed for an additional fee',
      'Official score reports available upon request',
    ],
  },
];

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative flex items-end overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" style={{ minHeight: 'clamp(260px, 45vw, 400px)' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAgTCAwIDIwIEwgMTAgMjAgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmZmYwMDIiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12 w-full text-white">
          <nav className="text-sm text-white/60 mb-4">
            <Link href="/testing" className="hover:text-white transition-colors">Testing Center</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Policies</span>
          </nav>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 bg-brand-red-600/20 text-brand-red-300 border border-brand-red-500/30">
            <FileText className="w-4 h-4" /> Important
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-3">Testing Center Policies</h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Please review these policies before booking your exam. Following these guidelines ensures a smooth testing experience.
          </p>
        </div>
      </section>

      {/* BODY */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {POLICIES.map((policy) => (
            <div key={policy.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <policy.icon className="w-6 h-6 text-brand-red-600" />
                  <h2 className="text-xl font-bold text-slate-900">{policy.title}</h2>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {policy.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                      <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 bg-amber-50 rounded-2xl p-8 border border-amber-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Questions About Our Policies?</h2>
          <p className="text-slate-600 mb-6">
            If you have questions about our testing policies or need to discuss a special circumstance, please contact us before your exam appointment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/contact" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors inline-flex items-center justify-center gap-2">
              Contact Us
            </Link>
            <Link href="/testing/book" className="border border-slate-300 text-slate-700 hover:bg-white font-bold px-6 py-3 rounded-xl transition-colors inline-flex items-center justify-center gap-2">
              Book an Exam
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
