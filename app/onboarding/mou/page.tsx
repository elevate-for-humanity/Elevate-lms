'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SignatureInput } from '@/components/onboarding/SignatureInput';
import { ArrowLeft, CheckCircle2, FileText, Building2, Users, Shield } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const MOU_VERSION = '2025.1';

interface MOUSection {
  id: string;
  title: string;
  content: string;
}

const MOU_SECTIONS: MOUSection[] = [
  {
    id: 'purpose',
    title: '1. Purpose',
    content: `This Memorandum of Understanding ("MOU") establishes the terms and expectations between the undersigned party ("Partner") and Elevate for Humanity Career & Technical Institute ("Elevate") for participation in workforce development, apprenticeship, or training programs.

This MOU is not a binding contract but a statement of mutual intent and cooperation.`,
  },
  {
    id: 'responsibilities-elevate',
    title: '2. Elevate Responsibilities',
    content: `Elevate for Humanity agrees to:

• Provide Related Technical Instruction (RTI) aligned with DOL-registered apprenticeship standards where applicable
• Maintain ETPL eligibility and program accreditation
• Supply curriculum, learning management system (LMS) access, and instructional support
• Track student attendance, progress, and competency milestones
• Coordinate with workforce boards (WorkOne) and funding agencies on behalf of enrolled students
• Provide career services including resume support, interview preparation, and job placement assistance
• Maintain FERPA-compliant student records`,
  },
  {
    id: 'responsibilities-partner',
    title: '3. Partner Responsibilities',
    content: `The Partner agrees to:

• Provide On-the-Job Training (OJT) opportunities or clinical/practical training sites as applicable
• Designate a site supervisor or mentor for each apprentice or trainee
• Maintain a safe, professional training environment compliant with OSHA standards
• Report student hours, performance, and any incidents to Elevate within 48 hours
• Participate in quarterly program reviews and outcome reporting
• Not discriminate against students on the basis of race, color, religion, sex, national origin, age, disability, or veteran status`,
  },
  {
    id: 'duration',
    title: '4. Duration & Termination',
    content: `This MOU is effective upon signature and remains in effect for twelve (12) months unless renewed or terminated.

Either party may terminate this MOU with thirty (30) days written notice. Termination does not affect the enrollment status of students currently in active training.`,
  },
  {
    id: 'confidentiality',
    title: '5. Confidentiality',
    content: `Both parties agree to maintain the confidentiality of student records, proprietary training materials, and business information shared during the partnership. Student data is protected under FERPA (20 U.S.C. § 1232g) and applicable state privacy laws.`,
  },
  {
    id: 'liability',
    title: '6. Liability & Insurance',
    content: `Each party is responsible for its own acts and omissions. Partners providing OJT sites must maintain general liability insurance with minimum coverage of $1,000,000 per occurrence and provide proof of coverage upon request.

Workers' compensation coverage must be maintained for all apprentices during OJT hours as required by Indiana state law.`,
  },
];

export default function MOUPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(MOU_SECTIONS.map(s => s.id)));
  const [hasReadAll, setHasReadAll] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) { router.push('/login'); return; }
      setUser(currentUser);

      // Check if MOU already signed
      const { data: existing } = await supabase
        .from('license_agreement_acceptances')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('agreement_type', 'mou')
        .maybeSingle();

      if (existing) setAlreadySigned(true);
    } catch (err) {
      console.error('Error loading MOU status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function signMOU() {
    if (!user) return;
    setSigning(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      const { error: insertError } = await supabase
        .from('license_agreement_acceptances')
        .insert({
          user_id: user.id,
          agreement_type: 'mou',
          document_version: MOU_VERSION,
          document_url: '/onboarding/mou',
          role_at_signing: profile?.role || 'partner',
          email_at_signing: user.email,
        });

      if (insertError) throw insertError;
      setSigned(true);
    } catch (err: any) {
      setError('Failed to record MOU acceptance. Please try again.');
    } finally {
      setSigning(false);
    }
  }

  function toggleSection(id: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Onboarding', href: '/onboarding' },
            { label: 'Memorandum of Understanding' },
          ]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-brand-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Memorandum of Understanding
          </h1>
          <p className="text-slate-600">
            Review the partnership terms below and sign to acknowledge your understanding.
          </p>
        </div>

        {alreadySigned && !signed ? (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-6 text-center mb-8">
            <CheckCircle2 className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-brand-green-900 mb-1">MOU Already Signed</h2>
            <p className="text-brand-green-700">You signed this MOU on a previous visit. No further action needed.</p>
            <Link href="/onboarding" className="inline-block mt-4 text-brand-blue-600 hover:underline">
              ← Back to Onboarding
            </Link>
          </div>
        ) : null}

        {/* MOU Sections */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-brand-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Elevate for Humanity — Partner MOU (v{MOU_VERSION})
              </h2>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {MOU_SECTIONS.map((section) => (
              <div key={section.id} className="p-6">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="font-semibold text-slate-900">{section.title}</h3>
                  <span className="text-slate-400 text-sm">
                    {expandedSections.has(section.id) ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.has(section.id) && (
                  <div className="mt-3 text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Acknowledgment + Signature */}
        {!alreadySigned && !signed && (
          <>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasReadAll}
                  onChange={(e) => setHasReadAll(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
                />
                <span className="text-slate-700">
                  I have read and understand all sections of this Memorandum of Understanding.
                  I acknowledge that this MOU represents a statement of mutual intent between
                  my organization and Elevate for Humanity.
                </span>
              </label>
            </div>

            {hasReadAll && user && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
                <h3 className="font-semibold text-slate-900 mb-4">Digital Signature</h3>
                <SignatureInput
                  userName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'Partner'}
                  documentType="mou"
                  onSignatureChange={() => {}}
                  onSignatureSaved={() => {}}
                  autoSave={false}
                />
              </div>
            )}

            {error && (
              <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-4 mb-6 text-brand-red-700">
                {error}
              </div>
            )}

            <button
              onClick={signMOU}
              disabled={!hasReadAll || signing}
              className="w-full py-4 bg-brand-blue-600 text-white font-bold rounded-xl hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {signing ? 'Recording...' : 'Accept & Sign MOU'}
            </button>
          </>
        )}

        {signed && (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-brand-green-900 mb-1">MOU Signed</h2>
            <p className="text-brand-green-700 mb-4">Your acceptance has been recorded.</p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700"
            >
              <ArrowLeft className="w-4 h-4" /> Continue Onboarding
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
