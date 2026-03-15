'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, CheckCircle2, Building2, ChevronDown, ChevronUp, Pen, Type, CheckSquare, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import SignatureCanvas from 'signature_pad';

const MOU_VERSION = '3.0';
const AGREEMENT_TYPE = 'mou';

type SignMethod = 'checkbox' | 'typed' | 'drawn';

const MOU_SECTIONS = [
  {
    id: 'parties',
    title: '1. Parties',
    content: `This Memorandum of Understanding ("Agreement") is entered into between 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Training Institute ("Operating Company") and the collaborating organization identified at execution ("Collaborating Party").

Elevate is the sole Program Owner and primary training provider. The Collaborating Party is a delivery-site collaborator operating under one of the participation tiers defined in Section 5. This Agreement does not create a partnership, joint venture, or shared ownership of any kind.`,
  },
  {
    id: 'not-a-partnership',
    title: '2. What This Agreement Is Not',
    content: `A "partnership" is a business relationship in which two or more parties jointly own and operate a business, share governance authority, and share profits, losses, and decision-making control. That is not this relationship.

This Agreement does not create a partnership, joint venture, franchise, co-ownership arrangement, employment relationship, or shared governance structure. The Collaborating Party does not obtain ownership rights, governance authority, or decision-making authority over the training program, its curriculum, its credentials, its tuition structure, or its brand.

The Collaborating Party may not represent itself as a co-owner, partner, co-founder, or governing authority of Elevate for Humanity in any public communication, grant application, funding proposal, or legal document.`,
  },
  {
    id: 'network',
    title: '3. Training Network Model and Indiana ETPL',
    content: `Elevate operates a Training Network Model in which Elevate serves as the sole Program Owner and Primary Training Provider. Authorized organizations participate as approved Training Network Sites for the purpose of delivering in-person or hybrid components of the program under Elevate's standardized delivery model.

Elevate operates as an eligible training provider under Indiana's INTraining / Eligible Training Provider List (ETPL) system, administered by the Indiana Department of Workforce Development (DWD). The Collaborating Party does not hold ETPL status independently under this Agreement.

All programs delivered under this Agreement must comply with federal nondiscrimination requirements under Title VI of the Civil Rights Act, Section 504 of the Rehabilitation Act, the Americans with Disabilities Act, and WIOA nondiscrimination provisions.`,
  },
  {
    id: 'authority',
    title: '4. Program Owner Authority',
    content: `Elevate retains sole and exclusive authority over:

• Curriculum design, content, and updates
• Learning Management System (LMS) and all digital instruction platforms
• Credential alignment, exam preparation, and testing relationships
• Tuition rates, financial policies, and student payment structures
• Student enrollment, admissions criteria, and program eligibility
• Instructor standards, qualifications, and quality control
• Elevate for Humanity brand, trademarks, and public identity
• Compliance reporting to DWD, federal workforce agencies, and credential bodies
• Student outcome data collection and reporting
• Program suspension, modification, or termination
• Expansion of the Training Network into additional states or regions

The Collaborating Party may not modify curriculum, alter tuition, issue credentials, apply for workforce funding on behalf of Elevate programs, or enter into agreements on behalf of Elevate.`,
  },
  {
    id: 'tiers',
    title: '5. Participation Tiers',
    content: `The Collaborating Party participates under one of the following tiers as designated in Schedule A:

TIER 1 — FACILITY HOST
Provides a dedicated physical training facility and on-site operational support for the full cohort duration.
Compensation: One-third (1/3) of net program revenue per cohort.
Requirements: Dedicated classroom, ADA accessibility, broadband internet, general liability insurance ($1M/$2M), workers' compensation if staff present, Elevate named as additional insured.

TIER 2 — COORDINATION PARTNER
Provides student coordination and supervision support. Does not provide a training facility.
Compensation: Fifteen percent (15%) of net program revenue per cohort.

TIER 3 — REFERRAL PARTNER
Refers eligible individuals to Elevate programs. No operational responsibility.
Compensation: $250–$500 flat fee per enrolled student. No revenue share.

Net revenue = gross tuition minus operational costs (credential exam fees, LMS, curriculum, marketing, compliance, administration, payment processing, insurance, student services, and Program Support Fee to the nonprofit Program Authority).`,
  },
  {
    id: 'ip',
    title: '6. Intellectual Property and Non-Replication',
    content: `All curriculum materials, instructional content, LMS systems, operational procedures, branding, credential alignments, and program methodologies are proprietary intellectual property owned exclusively by Elevate for Humanity.

The Collaborating Party receives limited, non-transferable authorization to support delivery of program components solely for approved cohorts under this Agreement. This authorization terminates automatically upon expiration or termination of this Agreement.

During the term of this Agreement and for three (3) years following termination, the Collaborating Party agrees not to:

• Replicate, reproduce, or develop a substantially similar training program using materials, systems, or methods provided through this collaboration
• Solicit or redirect enrolled students, instructors, credential partners, or employers into a competing program derived from the Elevate training model
• Use Elevate's program structure or credential relationships to apply independently for ETPL status or workforce funding for a competing program`,
  },
  {
    id: 'students',
    title: '7. Student Enrollment and Data',
    content: `All students enrolled in Elevate programs remain participants of the Elevate training program regardless of which facility delivers in-person components. Student records, enrollment data, and credential progress are maintained exclusively by Elevate.

The Collaborating Party does not obtain ownership rights over student enrollment, tuition structures, credential access, or post-program placement services. Student data is governed by FERPA and requires written student consent. Attendance records must be submitted to Elevate within 48 hours of each session.`,
  },
  {
    id: 'termination',
    title: '8. Term and Termination',
    content: `This Agreement is effective for one (1) year from execution and renews automatically for successive one-year terms unless either party provides 30 days written notice of non-renewal.

YOUR RIGHT TO EXIT: Either party — you or Elevate — may terminate this Agreement at any time, for any reason, by providing 30 days written notice. You do not need to provide a reason. You do not need Elevate's permission. Send written notice (email is acceptable) to your assigned Elevate coordinator and copy elevate4humanityedu@gmail.com. Termination takes effect 30 days from the date of notice. This right is non-negotiable and cannot be waived.

During the 30-day notice period, cohorts already in progress continue under this Agreement until completion. You remain responsible for students currently enrolled at your site.

After termination: transfer all student records to Elevate within 10 business days; return all Elevate materials and proprietary documents; submit final attendance reports and invoices within 30 days; Elevate will process outstanding payments owed to you within 30 days of receiving final documentation. Confidentiality and non-compete obligations remain in effect for 3 years after termination.

IMMEDIATE TERMINATION BY ELEVATE (no notice required): Elevate may terminate immediately — without the 30-day notice period — if the Collaborating Party: fails to maintain required insurance, violates federal nondiscrimination requirements, falsifies student records, misrepresents Elevate programs or credentials, represents itself as a partner or co-owner of Elevate, modifies curriculum or tuition without authorization, or creates an immediate safety risk to students.`,
  },
  {
    id: 'governing',
    title: '9. Governing Law',
    content: `This Agreement is governed by the laws of the State of Indiana. Disputes shall first be submitted to good-faith mediation. If unresolved within 30 days, the parties consent to jurisdiction in Marion County, Indiana.`,
  },
];

export default function MOUOnboardingPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pad, setPad] = useState<SignatureCanvas | null>(null);

  const [loading, setLoading] = useState(true);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(MOU_SECTIONS.map(s => s.id)));
  const [hasReadAll, setHasReadAll] = useState(false);

  // Signer fields
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [orgName, setOrgName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [tier, setTier] = useState<'tier1' | 'tier2' | 'tier3'>('tier1');

  // Signature method
  const [method, setMethod] = useState<SignMethod>('checkbox');
  const [typed, setTyped] = useState('');
  const [drawn, setDrawn] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) { router.push('/login'); return; }
      setSignerEmail(data.user.email ?? '');

      const { data: profile } = await supabase
        .from('profiles').select('full_name, role').eq('id', data.user.id).single();
      if (profile?.full_name) setSignerName(profile.full_name);

      const { data: existing } = await supabase
        .from('license_agreement_acceptances')
        .select('id')
        .eq('user_id', data.user.id)
        .eq('agreement_type', AGREEMENT_TYPE)
        .eq('document_version', MOU_VERSION)
        .maybeSingle();
      if (existing) setAlreadySigned(true);
      setLoading(false);
    });
  }, [router]);

  // Init drawn signature pad
  useEffect(() => {
    if (method !== 'drawn' || !canvasRef.current || pad) return;
    const instance = new SignatureCanvas(canvasRef.current, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: 'rgb(15,23,42)',
    });
    instance.addEventListener('endStroke', () => {
      if (!instance.isEmpty()) setDrawn(instance.toDataURL('image/png'));
    });
    const resize = () => {
      if (!canvasRef.current) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvasRef.current.width = canvasRef.current.offsetWidth * ratio;
      canvasRef.current.height = canvasRef.current.offsetHeight * ratio;
      canvasRef.current.getContext('2d')?.scale(ratio, ratio);
      instance.clear();
      setDrawn(null);
    };
    resize();
    window.addEventListener('resize', resize);
    setPad(instance);
    return () => { window.removeEventListener('resize', resize); instance.off(); };
  }, [method, pad]);

  const isValid = () => {
    if (!signerName.trim() || !signerEmail.trim() || !orgName.trim() || !acknowledged || !hasReadAll) return false;
    if (method === 'typed') return typed.trim().length > 1;
    if (method === 'drawn') return drawn !== null;
    return true;
  };

  const handleSign = async () => {
    if (!isValid()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/legal/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreements: [AGREEMENT_TYPE],
          signer_name: signerName.trim(),
          signer_email: signerEmail.trim(),
          signer_title: signerTitle.trim() || undefined,
          signature_method: method,
          signature_typed: method === 'typed' ? typed.trim() : undefined,
          signature_data: method === 'drawn' ? drawn : undefined,
          context: 'onboarding',
          organization_id: undefined, // populated server-side from profile
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to sign');
      }
      setSigned(true);
      setTimeout(() => router.push('/onboarding'), 2000);
    } catch (e: any) {
      setError(e.message || 'Failed to record signature. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = (id: string) => setExpandedSections(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding' }, { label: 'Training Network Partner Agreement' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <InstitutionalHeader
            documentType="Memorandum of Understanding"
            title="Training Network Partner Agreement"
            subtitle="Read all sections carefully. You must sign this agreement before accessing the partner portal."
            version={MOU_VERSION}
            noDivider
          />
        </div>

        {/* Already signed */}
        {alreadySigned && !signed && (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-brand-green-900 mb-1">Agreement Already Signed</h2>
            <p className="text-brand-green-700">Your signature (v{MOU_VERSION}) is on file.</p>
            <Link href="/onboarding" className="inline-block mt-4 text-brand-blue-600 hover:underline">← Back to Onboarding</Link>
          </div>
        )}

        {/* Agreement sections */}
        {!alreadySigned && !signed && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-brand-blue-600" />
                <div>
                  <h2 className="font-semibold text-slate-900">Agreement Terms — v{MOU_VERSION}</h2>
                  <p className="text-xs text-red-600 font-semibold mt-0.5">These terms are not up for negotiation. Read every section before signing.</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {MOU_SECTIONS.map(s => (
                  <div key={s.id} className="p-5">
                    <button onClick={() => toggle(s.id)} className="w-full flex items-center justify-between text-left gap-4">
                      <span className="font-semibold text-slate-900 text-sm">{s.title}</span>
                      {expandedSections.has(s.id)
                        ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    </button>
                    {expandedSections.has(s.id) && (
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{s.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Read confirmation */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={hasReadAll} onChange={e => setHasReadAll(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500" />
                <span className="text-sm text-slate-700">
                  I have read and understand all sections of this Training Network Partner Agreement (v{MOU_VERSION}).
                </span>
              </label>
            </div>

            {/* Signer details */}
            {hasReadAll && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h3 className="font-semibold text-slate-900">Signer Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Full Legal Name <span className="text-red-500">*</span></label>
                    <input type="text" value={signerName} onChange={e => setSignerName(e.target.value)}
                      placeholder="Your full legal name"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Title / Role <span className="text-slate-400">(optional)</span></label>
                    <input type="text" value={signerTitle} onChange={e => setSignerTitle(e.target.value)}
                      placeholder="e.g. Executive Director, Owner"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Organization Name <span className="text-red-500">*</span></label>
                    <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)}
                      placeholder="Legal name of your organization"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address <span className="text-red-500">*</span></label>
                    <input type="email" value={signerEmail} onChange={e => setSignerEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                </div>

                {/* Tier selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Participation Tier <span className="text-red-500">*</span></label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {([
                      { value: 'tier1', label: 'Tier 1 — Facility Host', desc: '1/3 of net revenue' },
                      { value: 'tier2', label: 'Tier 2 — Coordination Partner', desc: '15% of net revenue' },
                      { value: 'tier3', label: 'Tier 3 — Referral Partner', desc: '$250–$500 per student' },
                    ] as const).map(t => (
                      <button key={t.value} type="button" onClick={() => setTier(t.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-colors ${
                          tier === t.value ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200 hover:border-slate-300'
                        }`}>
                        <p className={`text-xs font-semibold ${tier === t.value ? 'text-brand-blue-700' : 'text-slate-700'}`}>{t.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Signature method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Signature Method</label>
                  <div className="flex gap-3">
                    {([
                      { m: 'checkbox' as SignMethod, Icon: CheckSquare, label: 'Checkbox' },
                      { m: 'typed' as SignMethod, Icon: Type, label: 'Type' },
                      { m: 'drawn' as SignMethod, Icon: Pen, label: 'Draw' },
                    ]).map(({ m, Icon, label }) => (
                      <button key={m} type="button" onClick={() => setMethod(m)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                          method === m ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}>
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {method === 'typed' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Type Your Signature <span className="text-red-500">*</span></label>
                    <input type="text" value={typed} onChange={e => setTyped(e.target.value)}
                      placeholder="Type your full name"
                      className="w-full max-w-sm px-4 py-3 border border-slate-300 rounded-lg text-2xl focus:ring-2 focus:ring-brand-blue-500"
                      style={{ fontFamily: "'Brush Script MT', cursive" }} />
                  </div>
                )}

                {method === 'drawn' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Draw Your Signature <span className="text-red-500">*</span></label>
                    <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white max-w-sm">
                      <canvas ref={canvasRef} style={{ width: '100%', height: '130px', touchAction: 'none' }} />
                    </div>
                    <button type="button" onClick={() => { pad?.clear(); setDrawn(null); }}
                      className="text-xs text-brand-blue-600 hover:underline mt-1">Clear</button>
                  </div>
                )}

                {/* Acknowledgment */}
                <label className="flex items-start gap-3 cursor-pointer p-4 bg-white rounded-xl border border-slate-200 hover:bg-white transition-colors">
                  <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500" />
                  <span className="text-sm text-slate-700 leading-relaxed">
                    I have read and understand this Training Network Partner Agreement in full. I am authorized to sign on behalf of my organization. I agree to be bound by its terms. I understand this constitutes a legally binding electronic signature under the Electronic Signatures in Global and National Commerce Act (E-SIGN).
                  </span>
                </label>

                {error && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                  <button onClick={handleSign} disabled={!isValid() || submitting}
                    className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-base transition-colors ${
                      isValid() && !submitting ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}>
                    {submitting
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing...</>
                      : 'Sign Training Network Partner Agreement'}
                  </button>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> Signature, IP address, and timestamp recorded securely.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Success */}
        {signed && (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-brand-green-900 mb-1">Agreement Signed</h2>
            <p className="text-brand-green-700 mb-1">Your signature has been recorded.</p>
            <p className="text-sm text-brand-green-600">Redirecting to onboarding...</p>
          </div>
        )}

        <div className="pb-8">
          <Link href="/onboarding" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Back to Onboarding
          </Link>
        </div>
      </div>
    </div>
  );
}
