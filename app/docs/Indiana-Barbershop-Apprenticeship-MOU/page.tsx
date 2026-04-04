'use client';

import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowLeft, Printer, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { SignatureInput } from '@/components/onboarding/SignatureInput';
import { createBrowserClient } from '@supabase/ssr';

export default function MOUPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorLicense, setSupervisorLicense] = useState('');
  const [compensationModel, setCompensationModel] = useState('');
  const [signedByPartner, setSignedByPartner] = useState(false);
  const [signedBySupervisor, setSignedBySupervisor] = useState(false);
  const [partnerSignatureId, setPartnerSignatureId] = useState<string | null>(null);
  const [supervisorSignatureId, setSupervisorSignatureId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [effectiveDate] = useState(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ id: u.id, email: u.email || '' });
    });
  }, []);

  const canSubmit = shopName && partnerName && supervisorName && supervisorLicense && compensationModel && signedByPartner && signedBySupervisor;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    setError('');

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await supabase.from('mou_signatures').insert({
        signer_name: partnerName,
        signer_title: 'Partner',
        supervisor_name: supervisorName,
        supervisor_license: supervisorLicense,
        compensation_model: compensationModel,
        mou_version: 'barbershop-v1',
        signature_data: {
          shop_name: shopName,
          partner_signature_id: partnerSignatureId,
          supervisor_signature_id: supervisorSignatureId,
          effective_date: effectiveDate,
          signer_email: user.email,
        },
        signed_at: new Date().toISOString(),
        ip_address: null,
      });

      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again or call (317) 314-3757.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-8 py-20 text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-brand-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">MOU Signed Successfully</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your Memorandum of Understanding has been digitally signed and recorded. You will receive a confirmation email.
          </p>
          <div className="bg-white rounded-xl p-6 max-w-md mx-auto mb-8 text-left">
            <p className="text-sm text-gray-600"><strong>Shop:</strong> {shopName}</p>
            <p className="text-sm text-gray-600"><strong>Partner:</strong> {partnerName}</p>
            <p className="text-sm text-gray-600"><strong>Supervisor:</strong> {supervisorName}</p>
            <p className="text-sm text-gray-600"><strong>Date:</strong> {effectiveDate}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/partner/onboarding" className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700">
              Continue to Partner Onboarding →
            </Link>
            <Link href="/partners/barbershop-apprenticeship" className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-white">
              Back to Partner Info
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Docs', href: '/docs' }, { label: 'Indiana Barbershop Apprenticeship MOU' }]} />
      </div>

      <div className="print:hidden bg-white py-4 border-b">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Link href="/partners/barbershop-apprenticeship" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back to Partner Info
          </Link>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12 print:py-0 print:px-0">
        <div className="prose prose-sm max-w-none">
          <h1 className="text-center text-2xl font-bold mb-2">MEMORANDUM OF UNDERSTANDING</h1>
          <h2 className="text-center text-lg font-semibold mb-1">Indiana Barbershop Apprenticeship Program</h2>
          <h3 className="text-center text-base mb-8">Worksite Partner Agreement</h3>

          <hr className="my-6" />

          <p><strong>Between:</strong></p>
          <ul>
            <li><strong>Sponsor:</strong> 2Exclusive LLC-S, DBA Elevate for Humanity Career &amp; Technical Institute (&quot;Sponsor&quot;)</li>
            <li><strong>Worksite Partner:</strong> {shopName || <em>(entered below)</em>} (&quot;Shop&quot;)</li>
          </ul>
          <p><strong>Effective Date:</strong> {effectiveDate}</p>

          <hr className="my-6" />

          <h2>1. PURPOSE</h2>
          <p>This Memorandum of Understanding (&quot;MOU&quot;) establishes the terms and conditions under which the Shop will serve as a worksite partner for the Indiana Barbershop Apprenticeship Program, a USDOL Registered Apprenticeship sponsored by 2Exclusive LLC-S (DBA Elevate for Humanity Career &amp; Technical Institute).</p>

          <h2>2. PROGRAM OVERVIEW</h2>
          <p>The Indiana Barbershop Apprenticeship Program is a structured training program that combines:</p>
          <ul>
            <li><strong>2,000 hours</strong> of on-the-job training (OJT) at the worksite</li>
            <li><strong>Related Technical Instruction (RTI)</strong> coordinated by the Sponsor via Elevate LMS</li>
            <li>Progressive skill development tracked through competency assessments</li>
          </ul>

          <h2>3. SPONSOR RESPONSIBILITIES</h2>
          <p>2Exclusive LLC-S (DBA Elevate for Humanity Career &amp; Technical Institute), as the Sponsor of Record, agrees to:</p>
          <h3>Registration &amp; Compliance</h3>
          <ul>
            <li>Maintain USDOL/RAPIDS registration for the apprenticeship program</li>
            <li>Handle all required reporting to state and federal agencies</li>
            <li>Ensure program compliance with applicable regulations</li>
          </ul>
          <h3>Related Instruction</h3>
          <ul>
            <li>Coordinate and provide access to required online instruction (Elevate LMS)</li>
            <li>Track completion of related instruction requirements</li>
            <li>Provide learning materials and resources at no cost to the Shop or apprentice</li>
          </ul>
          <h3>Documentation &amp; Support</h3>
          <ul>
            <li>Maintain official apprenticeship records</li>
            <li>Issue completion certificates upon program finish</li>
            <li>Provide ongoing support and troubleshooting</li>
            <li>Conduct periodic check-ins and site visits</li>
          </ul>
          <h3>Apprentice Recruitment</h3>
          <ul>
            <li>Screen and refer qualified apprentice candidates</li>
            <li>Verify apprentice eligibility for the program</li>
            <li>Facilitate matching between apprentices and worksites</li>
          </ul>
          <h3>Hour Tracking Technology</h3>
          <ul>
            <li>Provide GPS-verified digital timeclock system for OJT hour tracking</li>
            <li>Set up geofence around the Shop&apos;s physical location</li>
            <li>Provide partner portal access for hour review and approval</li>
          </ul>

          <h2>4. WORKSITE PARTNER RESPONSIBILITIES</h2>
          <p>The Shop agrees to:</p>
          <h3>Supervision</h3>
          <ul>
            <li>Provide direct supervision by a licensed barber during all productive work hours</li>
            <li>Ensure the supervising barber has a minimum of 2 years licensed experience</li>
            <li>Maintain appropriate supervisor-to-apprentice ratios</li>
          </ul>
          <h3>Compensation</h3>
          <ul>
            <li>Pay the apprentice according to the agreed compensation model</li>
            <li>Ensure all compensation meets or exceeds applicable minimum wage requirements</li>
            <li>Maintain accurate payroll records</li>
          </ul>
          <p className="bg-yellow-50 p-3 border-l-4 border-yellow-500"><strong>Note:</strong> Apprentices are paid employees. This is NOT unpaid labor.</p>
          <h3>Training &amp; Development</h3>
          <ul>
            <li>Provide structured on-the-job training opportunities</li>
            <li>Allow apprentice to practice and develop required competencies</li>
            <li>Support apprentice completion of Elevate LMS coursework</li>
          </ul>
          <h3>Hour Verification</h3>
          <ul>
            <li>Review and approve apprentice hours submitted through the Elevate platform</li>
            <li>Reject any hours not actually supervised</li>
            <li>Sign off on competencies demonstrated</li>
          </ul>
          <h3>Workplace Standards</h3>
          <ul>
            <li>Maintain a safe, professional workplace environment</li>
            <li>Carry workers&apos; compensation insurance</li>
            <li>Comply with all applicable health and safety regulations</li>
            <li>Maintain required business licenses in good standing</li>
          </ul>
          <h3>Communication</h3>
          <ul>
            <li>Notify Sponsor promptly of any issues or concerns</li>
            <li>Cooperate with Sponsor for documentation and compliance</li>
            <li>Allow Sponsor site visits for quality assurance</li>
            <li>Respond to Sponsor inquiries in a timely manner</li>
          </ul>

          <h2>5. COMPENSATION MODELS</h2>
          <p>The Shop may compensate the apprentice using one of the following models:</p>
          <ul>
            <li><strong>Hourly Wage:</strong> Fixed hourly rate for all hours worked</li>
            <li><strong>Commission:</strong> Percentage of services performed (must meet minimum wage when averaged)</li>
            <li><strong>Hybrid:</strong> Base hourly rate plus commission on services</li>
          </ul>
          <p className="bg-amber-50 p-3 border-l-4 border-amber-500"><strong>IMPORTANT:</strong> All compensation structures must comply with applicable federal and Indiana wage and labor laws. Commission-based models must ensure the apprentice earns at least minimum wage when averaged over the pay period.</p>

          <h2>6. TERM AND TERMINATION</h2>
          <p><strong>Term:</strong> This MOU is effective from the date signed until the apprentice completes the program or the agreement is terminated.</p>
          <p><strong>Your Right to Exit — 30 Days Written Notice:</strong> Either party — the Shop or the Sponsor — may terminate this MOU at any time, for any reason, by providing <strong>30 days written notice</strong>. Send written notice (email is acceptable) to your assigned Elevate coordinator and copy elevate4humanityedu@gmail.com. You do not need to provide a reason. You do not need the other party&apos;s permission. This right is non-negotiable and cannot be waived.</p>
          <p><strong>During the 30-day notice period:</strong> The apprentice continues their OJT and the Shop continues its obligations under this MOU. The Sponsor will work with the Shop and the apprentice on a transition plan.</p>
          <p><strong>Immediate Termination by Sponsor (no notice required):</strong> The Sponsor may terminate immediately — without the 30-day notice period — if the Shop: fails to pay the apprentice as agreed; violates any workplace safety or OSHA requirement; loses any required business license or insurance; falsifies OJT hours or program records; engages in misconduct affecting the apprentice&apos;s safety or welfare; or violates federal nondiscrimination requirements.</p>
          <p><strong>After Termination:</strong> The Shop must submit all outstanding OJT hour records to the Sponsor within 10 business days. The apprentice&apos;s program records remain with the Sponsor. The Sponsor will work to reassign the apprentice to another approved worksite if possible.</p>

          <h2>7. CONFIDENTIALITY</h2>
          <p><strong>Apprentice Data:</strong> Both parties agree to maintain confidentiality of apprentice personally identifiable information (PII) in compliance with applicable privacy laws. The Shop may not disclose apprentice PII to any third party without written apprentice consent and Sponsor authorization, except as required for program administration or by law.</p>
          <p><strong>Elevate Confidential Information:</strong> The Shop also receives access to Elevate&apos;s operational procedures, program materials, and business information through this collaboration. This information is confidential and may not be disclosed or used for any purpose other than fulfilling obligations under this MOU. A full Non-Disclosure Agreement is incorporated by reference into this MOU and is available at <strong>elevateforhumanity.org/legal/nda</strong>.</p>
          <p><strong>Non-Compete and Non-Replication:</strong> During the term of this MOU and for three (3) years following termination, the Shop agrees not to use Elevate&apos;s program structure, RAPIDS registration, or DWD relationships to independently register or operate a competing USDOL Registered Apprenticeship program in barbering, and not to solicit or redirect Elevate apprentice candidates or credential partners into a competing program derived from the Elevate apprenticeship model. A full Non-Compete Agreement is incorporated by reference into this MOU and is available at <strong>elevateforhumanity.org/legal/non-compete</strong>. These terms are not up for negotiation.</p>

          <h2>8. INDEMNIFICATION</h2>
          <p>Each party agrees to indemnify and hold harmless the other party from claims arising from their own negligence or willful misconduct in connection with this MOU.</p>

          <h2>9. DISPUTE RESOLUTION</h2>
          <p>The parties agree to attempt to resolve any disputes through good faith negotiation. If unresolved, disputes may be submitted to mediation before pursuing other remedies.</p>

          <h2>10. AMENDMENTS</h2>
          <p>This MOU may only be amended in writing signed by both parties.</p>

          <h2>11. ENTIRE AGREEMENT</h2>
          <p>This MOU constitutes the entire agreement between the parties regarding the subject matter herein and supersedes all prior agreements and understandings.</p>
        </div>

        <hr className="my-8" />

        {/* Digital Signature Section */}
        <div className="print:hidden" id="sign">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Digital Signature</h2>

          {!user && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Account Required</p>
                  <p className="text-amber-800 mt-1">You must be signed in to digitally sign this MOU.</p>
                  <Link href="/signup?redirect=/docs/Indiana-Barbershop-Apprenticeship-MOU" className="inline-block mt-3 px-5 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700">
                    Create Account / Sign In →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {user && (
            <div className="space-y-8">
              {error && (
                <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-center gap-3 text-brand-red-700">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <div className="bg-white rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Worksite Partner Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
                    <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Your barbershop name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner / Authorized Signer Name *</label>
                    <input type="text" value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="Full legal name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Supervising Barber</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Name *</label>
                    <input type="text" value={supervisorName} onChange={e => setSupervisorName(e.target.value)} placeholder="Licensed barber name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Indiana License # *</label>
                    <input type="text" value={supervisorLicense} onChange={e => setSupervisorLicense(e.target.value)} placeholder="License number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Compensation Model *</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    { value: 'hourly', label: 'Hourly Wage' },
                    { value: 'commission', label: 'Commission' },
                    { value: 'hybrid', label: 'Hybrid (Wage + Commission)' },
                  ].map(model => (
                    <label key={model.value} className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer ${compensationModel === model.value ? 'border-brand-blue-500 bg-brand-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="compensation" value={model.value} checked={compensationModel === model.value} onChange={e => setCompensationModel(e.target.value)} className="text-brand-blue-600" />
                      <span className="text-gray-700 font-medium">{model.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Worksite Partner Signature</h3>
                <p className="text-sm text-gray-600 mb-4">The shop owner or authorized representative must sign below.</p>
                <SignatureInput
                  userName={partnerName || 'Enter name above'}
                  documentId="partner-mou"
                  documentType="partner_mou"
                  onSignatureChange={(sig) => setSignedByPartner(!!sig)}
                  onSignatureSaved={(id) => setPartnerSignatureId(id)}
                  autoSave={false}
                />
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Supervising Barber Signature</h3>
                <p className="text-sm text-gray-600 mb-4">The supervising licensed barber must sign below.</p>
                <SignatureInput
                  userName={supervisorName || 'Enter name above'}
                  documentId="partner-mou-supervisor"
                  documentType="partner_mou_supervisor"
                  onSignatureChange={(sig) => setSignedBySupervisor(!!sig)}
                  onSignatureSaved={(id) => setSupervisorSignatureId(id)}
                  autoSave={false}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="w-full inline-flex items-center justify-center px-8 py-4 bg-brand-green-600 text-white rounded-lg font-bold hover:bg-brand-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><CheckCircle className="w-5 h-5 mr-2" /> Sign &amp; Submit MOU</>
                )}
              </button>

              {!canSubmit && (
                <p className="text-sm text-gray-500 text-center">
                  Complete all fields and both signatures above to submit.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Print-only signature lines */}
        <div className="hidden print:block mt-12">
          <div className="prose prose-sm max-w-none">
            <h2>SIGNATURES</h2>
            <div className="mt-8">
              <p><strong>SPONSOR: 2Exclusive LLC-S (DBA Elevate for Humanity Career &amp; Technical Institute)</strong></p>
              <p className="mt-4">Signature: _________________________________</p>
              <p>Printed Name: _________________________________</p>
              <p>Title: _________________________________</p>
              <p>Date: _________________________________</p>
            </div>
            <hr className="my-6" />
            <div className="mt-8">
              <p><strong>WORKSITE PARTNER:</strong></p>
              <p>Shop Name: _________________________________</p>
              <p className="mt-4">Signature: _________________________________</p>
              <p>Printed Name: _________________________________</p>
              <p>Title: _________________________________</p>
              <p>Date: _________________________________</p>
            </div>
            <hr className="my-6" />
            <div className="mt-8">
              <p><strong>SUPERVISING BARBER:</strong></p>
              <p className="mt-4">Signature: _________________________________</p>
              <p>Printed Name: _________________________________</p>
              <p>Indiana License #: _________________________________</p>
              <p>Date: _________________________________</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 print:mt-12">
          <p>2Exclusive LLC-S (DBA Elevate for Humanity Career &amp; Technical Institute)</p>
          <p>Indianapolis, Indiana | www.elevateforhumanity.org</p>
          <p>RAPIDS Program ID: 2025-IN-132301</p>
        </div>
      </div>
    </div>
  );
}
