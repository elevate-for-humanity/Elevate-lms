export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Truck, Phone, Clock, FileText, Users } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: "Application Received | CDL Training",
  description: "Your CDL Training application has been received. Here's what happens next.",
};

export default function CDLEnrollmentSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Truck className="w-12 h-12 text-white" />
          </div>
          <p className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-2">
            CDL Training Program
          </p>
          <h1 className="text-4xl font-black text-white mb-2">
            You&apos;re on your way to your CDL.
          </h1>
          <p className="text-slate-400">
            Your application has been received. Our enrollment team will contact you within 1
            business day.
          </p>
        </div>

        {/* Confirmation card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-amber-500 px-6 py-3">
            <p className="text-white font-bold text-sm">Application Received</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 py-3 border-b border-slate-100">
              <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-sm">Application submitted</p>
                <p className="text-slate-500 text-xs">Recorded in our enrollment system</p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3 border-b border-slate-100">
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-sm">Eligibility review</p>
                <p className="text-slate-500 text-xs">
                  We verify your funding eligibility (WIOA, FSSA, etc.)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3 border-b border-slate-100">
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-sm">Enrollment confirmation</p>
                <p className="text-slate-500 text-xs">
                  You receive your start date and training details
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3">
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-sm">Training begins</p>
                <p className="text-slate-500 text-xs">
                  Class A (3–4 weeks) or Class B (1–2 weeks) at our Indianapolis facility
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <p className="text-white font-bold mb-4">While you wait</p>
          <div className="space-y-3">
            {[
              {
                icon: FileText,
                title: 'Gather your documents',
                desc: "Valid driver's license, Social Security card, proof of Indiana residency",
              },
              {
                icon: Users,
                title: 'Schedule your WorkOne appointment',
                desc: 'Required for WIOA funding — your enrollment team will guide you',
              },
              {
                icon: CheckCircle,
                title: 'Prepare for your DOT physical',
                desc: 'Required before training begins — we can refer you to an approved clinic',
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{title}</p>
                  <p className="text-slate-400 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <Link
          href="/contact?program=cdl-training"
          className="block w-full bg-amber-500 hover:bg-amber-600 text-white text-center py-5 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg mb-3"
        >
          Speak With Enrollment →
        </Link>
        <Link
          href="/programs/cdl-training"
          className="block w-full bg-slate-700 hover:bg-slate-600 text-white text-center py-4 rounded-xl font-bold transition-all mb-6"
        >
          Back to CDL Program Page
        </Link>

        {/* Contact */}
        <div className="text-center space-y-1">
          <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Mon–Fri 9am–5pm ET
          </p>
          <a
            href={`tel:${PLATFORM_DEFAULTS.supportPhone}`}
            className="text-amber-400 hover:underline text-sm flex items-center justify-center gap-1"
          >
            <Phone className="w-3 h-3" />
            {PLATFORM_DEFAULTS.supportPhone}
          </a>
        </div>

      </div>
    </div>
  );
}
