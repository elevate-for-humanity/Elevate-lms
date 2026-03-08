'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { AgreementSignature } from '@/components/compliance/AgreementSignature';

const AGREEMENT = {
  type: 'enrollment',
  title: 'Enrollment Agreement',
  version: '2025.1',
  documentUrl: '/legal/enrollment-agreement',
  description: 'One signature covers program terms, attendance policy, student conduct, and FERPA consent.',
};

const AGREEMENT_POINTS = [
  {
    image: '/images/pages/comp-cta-training.jpg',
    title: 'Program Terms',
    body: '12-week training, 240 hours of instruction, hands-on labs at employer sites.',
  },
  {
    image: '/images/pages/about-career-training.jpg',
    title: 'Attendance Policy',
    body: 'Minimum 80% attendance required. Three unexcused absences triggers an intervention.',
  },
  {
    image: '/images/pages/comp-cta-career.jpg',
    title: 'Student Conduct',
    body: 'Professional behavior in class, online, and at employer sites at all times.',
  },
  {
    image: '/images/pages/about-funding-nav.jpg',
    title: 'FERPA Consent',
    body: 'Authorizes sharing your enrollment and progress with your funding source.',
  },
];

export default function AgreementsPage() {
  const router = useRouter();
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { router.push('/login'); return; }
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data?.user) { router.push('/login'); return; }
      fetch('/api/compliance/record?type=agreements')
        .then(r => r.json())
        .then(result => {
          const types = new Set((result.data || []).map((a: any) => a.agreement_type));
          setSigned(types.has('enrollment'));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* VIDEO HERO — not muted, script plays on load */}
      <div className="relative overflow-hidden" style={{ minHeight: 340 }}>
        <div className="absolute inset-0">
          <video
            src="/videos/hvac-technician.mp4"
            autoPlay
            loop
            playsInline
            className="w-full h-full object-cover"
            style={{ minHeight: 340 }}
          />
          <audio src="/generated/lessons/lesson-2f172cb2-4657-5460-9b93-f9b062ad8dd2.mp3" autoPlay preload="auto" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-12">
          <Link href="/onboarding/learner" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-6 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Onboarding
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
            Sign Your Enrollment Agreement
          </h1>
          <p className="text-white/80 text-lg max-w-xl">
            One signature covers everything. Takes less than 60 seconds.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* WHAT YOU'RE AGREEING TO — picture cards */}
        <h2 className="text-lg font-bold text-slate-900 mb-4">What you&apos;re agreeing to</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {AGREEMENT_POINTS.map((pt) => (
            <div key={pt.title} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-28">
                <Image src={pt.image} alt={pt.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="text-white text-xs font-bold drop-shadow">{pt.title}</span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-slate-600 leading-relaxed">{pt.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* SIGNED */}
        {signed ? (
          <div className="bg-brand-green-50 border-2 border-brand-green-200 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-brand-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-brand-green-900 mb-2">Agreement Signed</h2>
            <p className="text-brand-green-700 mb-6">Your enrollment agreement is on file.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/onboarding/learner" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white rounded-xl font-semibold hover:bg-brand-green-700 transition">
                Continue Onboarding <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/lms/courses/f0593164-55be-5867-98e7-8a86770a8dd0" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700 transition">
                Go to HVAC Course <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* SIGNATURE FORM */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <Image src="/images/pages/comp-cta-career.jpg" alt="Enrollment Agreement" fill className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{AGREEMENT.title}</h3>
                <p className="text-xs text-slate-500">{AGREEMENT.description}</p>
              </div>
            </div>
            <div className="p-6">
              <AgreementSignature
                agreementType={AGREEMENT.type}
                documentVersion={AGREEMENT.version}
                documentUrl={AGREEMENT.documentUrl}
                acceptanceContext="learner-onboarding"
                onSuccess={() => setSigned(true)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
