'use client';

import { useEffect, useState } from 'react';
import CanonicalVideo from '@/components/video/CanonicalVideo';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, ArrowRight, ExternalLink, CheckSquare, Square } from 'lucide-react';
import { AgreementSignature } from '@/components/compliance/AgreementSignature';

// Documents the student must acknowledge reading before signing.
const REQUIRED_READINGS = [
  {
    id: 'privacy',
    label: 'Privacy Policy',
    description: 'How we collect, use, and protect your personal data (FERPA, WIOA, Indiana law).',
    href: '/privacy-policy',
  },
  {
    id: 'terms',
    label: 'Terms of Service',
    description: 'Platform usage terms, program conditions, and governing law.',
    href: '/terms-of-service',
  },
  {
    id: 'handbook',
    label: 'Student Handbook',
    description: 'Attendance policy, dress code, conduct standards, and grievance procedures.',
    href: '/onboarding/learner/handbook',
  },
];

const AGREEMENT = {
  type: 'enrollment',
  title: 'Enrollment Agreement',
  version: '2025.1',
  documentUrl: '/legal/enrollment-agreement',
  description: 'One signature covers program terms, attendance policy, student conduct, and FERPA consent.',
};

const AGREEMENT_POINTS = [
  {
    image: '/images/pages/career-services-page-2.jpg',
    title: 'Program Terms',
    body: '12-week training, 240 hours of instruction, hands-on labs at employer sites.',
  },
  {
    image: '/images/pages/adult-learner.jpg',
    title: 'Attendance Policy',
    body: 'Minimum 80% attendance required. Three unexcused absences triggers an intervention.',
  },
  {
    image: '/images/pages/career-services-page-2.jpg',
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
  // Track which documents the student has acknowledged reading
  const [readAcks, setReadAcks] = useState<Record<string, boolean>>({});
  const allRead = REQUIRED_READINGS.every((r) => readAcks[r.id]);

  function toggleAck(id: string) {
    setReadAcks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  useEffect(() => {
    const supabase = createClient();
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* VIDEO HERO — Elevate overview, full bleed, no overlay text */}
      <div className="relative w-full overflow-hidden" style={{ height: '60vh', minHeight: 320, maxHeight: 560 }}>
        <CanonicalVideo
          src="/videos/elevate-overview-with-narration.mp4"
          poster="/images/pages/enrollment-agreement-page-1.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Back link below the video */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link href="/onboarding/learner" className="inline-flex items-center gap-1 text-brand-blue-600 hover:text-brand-blue-800 text-sm transition">
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-black text-slate-900 mb-1">Sign Your Enrollment Agreement</h1>
        <p className="text-slate-500 text-sm mb-8">One signature covers everything. Takes less than 60 seconds.</p>

        {/* WHAT YOU'RE AGREEING TO — picture cards */}
        <h2 className="text-lg font-bold text-slate-900 mb-4">What you&apos;re agreeing to</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {AGREEMENT_POINTS.map((pt) => (
            <div key={pt.title} className="rounded-2xl overflow-hidden shadow-md flex flex-col">
              {/* Image fills a fixed aspect ratio — no clipping, no overflow */}
              <div className="relative w-full aspect-[4/3]" style={{ paddingBottom: '66%' }}>
                <Image
                  src={pt.image}
                  alt={pt.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-3 py-2">
                  <span className="text-white text-sm font-bold leading-tight">{pt.title}</span>
                </div>
              </div>
              {/* Description below image */}
              <div className="bg-white flex-1 px-3 py-3">
                <p className="text-xs text-slate-600 leading-relaxed">{pt.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* REQUIRED READINGS — must acknowledge before signature form unlocks */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Read before you sign</h2>
          <p className="text-sm text-slate-500 mb-4">Open each document, then check the box to confirm you&apos;ve read it. The signature form unlocks when all three are acknowledged.</p>
          <div className="space-y-3">
            {REQUIRED_READINGS.map((doc) => {
              const checked = !!readAcks[doc.id];
              return (
                <div key={doc.id} className={`flex items-start gap-4 rounded-xl border p-4 transition ${checked ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                  <button
                    type="button"
                    onClick={() => toggleAck(doc.id)}
                    className="mt-0.5 flex-shrink-0 text-emerald-600"
                    aria-label={checked ? `Uncheck ${doc.label}` : `Check ${doc.label}`}
                  >
                    {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{doc.label}</span>
                      <Link
                        href={doc.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-blue-600 hover:text-brand-blue-800 transition"
                      >
                        Read <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIGNED */}
        {signed ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Agreement Signed</h2>
            <p className="text-slate-500 mb-6">Your enrollment agreement is on file.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/onboarding/learner" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-700 transition">
                Continue Onboarding <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/lms/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700 transition">
                Go to My Courses <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : !allRead ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
            Acknowledge all three documents above to unlock the signature form.
          </div>
        ) : (
          /* SIGNATURE FORM — only shown after all readings acknowledged */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <Image src="/images/pages/career-services-page-2.jpg" alt="Enrollment Agreement" fill className="object-cover"  sizes="100vw" />
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
                onSuccess={async () => {
                  setSigned(true);
                  // Mark agreements step complete in onboarding_progress
                  await fetch('/api/onboarding/complete-step', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ step: 'agreements' }),
                  });
                  router.push('/onboarding/learner');
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
