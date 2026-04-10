'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle2, Eraser, Loader2, AlertCircle } from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';

const MOU_SECTIONS = [
  {
    title: '1. Parties and Purpose',
    content: `This Memorandum of Understanding ("MOU") is entered into between 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Technical Institute ("Sponsor") and the salon identified at execution ("Worksite Partner" or "Salon").

This MOU establishes the terms under which the Salon will serve as a worksite for the Indiana Cosmetology Apprenticeship Program, RAPIDS Program ID: 2025-IN-132302, a USDOL Registered Apprenticeship sponsored by Elevate for Humanity.

WHAT THIS AGREEMENT IS: This is a worksite hosting agreement for a federally registered apprenticeship program. The Salon is hosting an apprentice employee and providing on-the-job training under federal Department of Labor oversight.

WHAT THIS AGREEMENT IS NOT: This MOU does not make the Salon a Training Network Partner, a co-owner of Elevate programs, a revenue-sharing partner, or a program delivery site for any Elevate training program other than the cosmetology apprenticeship. The Salon has no ownership rights, governance authority, or decision-making authority over Elevate's programs, curriculum, credentials, or brand.`,
  },
  {
    title: '2. Program Structure — Non-Negotiable Federal Requirements',
    content: `The Indiana Cosmetology Apprenticeship Program is a USDOL Registered Apprenticeship. Its structure is set by federal law and the registered program standards. These terms are not negotiable.

Program requirements:
• 2,000 hours of on-the-job training (OJT) at the worksite, supervised by a licensed cosmetologist
• Related Technical Instruction (RTI) coordinated by the Sponsor (Elevate)
• Progressive skill development tracked through competency assessments per the registered standards
• Apprentice must be registered with USDOL/RAPIDS before OJT hours begin
• All OJT hours must be documented and submitted to the Sponsor monthly

The Sponsor maintains sole authority over: RTI curriculum and delivery; competency assessment standards; RAPIDS registration and reporting; completion certificate issuance; program standards and modifications.`,
  },
  {
    title: '3. Sponsor Responsibilities',
    content: `Elevate for Humanity agrees to:

• Maintain USDOL/RAPIDS registration and all required federal reporting
• Develop, deliver, and update all Related Technical Instruction (RTI)
• Maintain official apprentice records and program documentation
• Issue completion certificates upon successful program completion
• Screen and refer qualified apprentice candidates to the Salon
• Provide the Salon with competency checklists and OJT tracking tools
• Conduct periodic worksite visits to verify program compliance
• Serve as the point of contact with Indiana DWD and USDOL for all program matters`,
  },
  {
    title: '4. Worksite Partner Responsibilities — Non-Negotiable',
    content: `These responsibilities are required by federal apprenticeship law and USDOL program standards. They are not optional and are not subject to modification.

The Salon agrees to:

SUPERVISION: Provide direct, on-site supervision of the apprentice by a currently licensed Indiana cosmetologist at all times during OJT hours. The supervising cosmetologist must hold an active Indiana IPLA cosmetology license with at least 2 years of experience. No exceptions.

EMPLOYMENT: The apprentice is a paid employee of the Salon — not a volunteer, intern, or independent contractor. The Salon is the employer of record for the apprentice during OJT. The Salon is responsible for payroll, withholding, workers' compensation, and all employer obligations under Indiana and federal law.

WAGES: Pay the apprentice according to the agreed progressive wage schedule (see Section 5). Failure to pay the apprentice as agreed is grounds for immediate termination of this MOU and will be reported to USDOL.

HOURS TRACKING: Accurately track and submit OJT hours to the Sponsor monthly using the provided tracking forms. Falsifying OJT hours is a federal offense.

SAFETY: Maintain a safe workplace that complies with all OSHA standards and Indiana workplace safety requirements. Report any workplace injury involving the apprentice to the Sponsor within 24 hours.

INSURANCE: Carry workers' compensation insurance covering the apprentice. Provide proof of coverage to the Sponsor before the apprentice begins OJT.

LICENSES: Maintain all required business licenses, health permits, and salon operating licenses throughout the term of this MOU. Notify the Sponsor immediately if any license lapses.

NONDISCRIMINATION: Comply with all federal nondiscrimination requirements under WIOA Section 188, Title VI of the Civil Rights Act, the ADA, and all applicable equal opportunity laws. The apprenticeship program is open to all qualified individuals regardless of race, color, religion, sex, national origin, age, or disability.`,
  },
  {
    title: '5. Apprentice Compensation — Federal Minimum Standards',
    content: `Apprentice compensation is governed by federal apprenticeship standards and Indiana minimum wage law. These minimums are not negotiable.

The apprentice is a paid employee. Compensation on a sole commission basis is prohibited under federal apprenticeship rules.

Approved compensation models:
• HOURLY: $10.00–$15.00/hr recommended. Must meet Indiana minimum wage ($7.25/hr) at all times.
• HYBRID: $8.00–$10.00/hr base wage PLUS 15%–25% commission on services performed. Base wage must meet Indiana minimum wage at all times.

Progressive wage increases are required as the apprentice advances through the program. The wage schedule is set in the registered program standards and must be followed.

Apprentices retain 100% of tips. Tips may not be counted toward the minimum wage requirement.

The Salon is responsible for all payroll taxes, withholding, and employer contributions for the apprentice.`,
  },
  {
    title: '6. Term and Termination — 30-Day Notice Right',
    content: `This MOU is effective from the date signed and continues until the apprentice completes the program, withdraws, or the agreement is terminated.

YOUR RIGHT TO EXIT: Either party — the Salon or the Sponsor — may terminate this MOU at any time for any reason by providing 30 days written notice. Send written notice (email is acceptable) to your assigned Elevate coordinator and copy elevate4humanityedu@gmail.com. You do not need to provide a reason. You do not need the other party's permission. This right is non-negotiable and cannot be waived.

During the 30-day notice period: the apprentice continues their OJT and the Salon continues its obligations under this MOU. The Sponsor will work with the Salon and the apprentice on a transition plan.

IMMEDIATE TERMINATION BY SPONSOR (no notice required): The Sponsor may terminate this MOU immediately — without the 30-day notice period — if the Salon:
• Fails to pay the apprentice as agreed
• Violates any workplace safety or OSHA requirement
• Loses any required business license or insurance
• Falsifies OJT hours or program records
• Engages in misconduct affecting the apprentice's safety or welfare
• Violates federal nondiscrimination requirements

After termination: the Salon must submit all outstanding OJT hour records to the Sponsor within 10 business days. The apprentice's program records remain with the Sponsor.`,
  },
  {
    title: '7. Confidentiality and Non-Disclosure',
    content: `Both parties agree to maintain confidentiality of apprentice personally identifiable information (PII) in compliance with applicable privacy laws.

The Salon may not disclose apprentice PII (name, contact information, wage information, program records) to any third party without written apprentice consent and Sponsor authorization, except as required for program administration or by law.

The Salon also receives access to Elevate's operational procedures, program materials, and business information through this collaboration. This information is confidential. The Salon may not disclose or use Elevate's confidential information for any purpose other than fulfilling its obligations under this MOU.

A full Non-Disclosure Agreement is available at elevateforhumanity.org/legal/nda and is incorporated by reference into this MOU.`,
  },
  {
    title: '8. Non-Compete and Non-Replication',
    content: `The Salon receives access to Elevate's registered apprenticeship program structure, curriculum relationships, RAPIDS registration, and credential pathways through this collaboration. This access is provided to support the apprentice — not to enable the Salon to replicate the program independently.

During the term of this MOU and for three (3) years following termination, the Salon agrees not to:
• Use Elevate's program structure, RAPIDS registration, or DWD relationships to independently register or operate a competing USDOL Registered Apprenticeship program in cosmetology
• Solicit or redirect Elevate apprentice candidates, instructors, or credential partners into a competing program derived from the Elevate apprenticeship model
• Represent to any funding agency, employer, or student that the Salon independently operates the Indiana Cosmetology Apprenticeship Program

These restrictions do not prevent the Salon from: operating as a salon, employing licensed cosmetologists, hiring apprentices through other registered programs, or participating in training programs that are not substantially similar to the Elevate apprenticeship model.`,
  },
  {
    title: '9. Partner Handbook — Required Reading',
    content: `The Worksite Partner Handbook is incorporated by reference into this MOU and forms part of this agreement. The Handbook details the day-to-day responsibilities, compensation requirements, hour tracking procedures, prohibited practices, and communication expectations that govern the worksite relationship.

By signing this MOU, the Salon confirms that it has read and understood the Partner Handbook in full prior to signing. The Handbook is available at: elevateforhumanity.org/partners/cosmetology-apprenticeship/handbook

Failure to comply with the standards set out in the Handbook constitutes a breach of this MOU and may result in immediate termination of the partnership and notification to USDOL.`,
  },
  {
    title: '10. Dispute Resolution',
    content: `The parties agree to attempt to resolve any disputes through good-faith negotiation first. If a dispute cannot be resolved through negotiation within 15 business days, either party may submit the dispute to mediation.

If mediation is unsuccessful, the parties consent to jurisdiction in Marion County, Indiana. This MOU is governed by the laws of the State of Indiana.

USDOL/RAPIDS compliance disputes are subject to federal apprenticeship regulations and may be reported to the Indiana Department of Workforce Development or the U.S. Department of Labor, Office of Apprenticeship.`,
  },
];

export default function CosmetologySignMOUPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureDataRef = useRef<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [salonName, setSalonName] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('Owner / Licensed Cosmetologist');
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorLicense, setSupervisorLicense] = useState('');
  const [compensationModel, setCompensationModel] = useState('hourly');
  const [compensationRate, setCompensationRate] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [handbookRead, setHandbookRead] = useState(false);

  useEffect(() => {
    fetch('/api/partners/cosmetology-apprenticeship/my-application')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (data.salon_legal_name || data.name) setSalonName(data.salon_legal_name || data.name);
        if (data.owner_name) setSignerName(data.owner_name);
        if (data.supervisor_name) setSupervisorName(data.supervisor_name);
        if (data.supervisor_license_number) setSupervisorLicense(data.supervisor_license_number);
        if (data.compensation_model) setCompensationModel(data.compensation_model);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const initCanvas = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.moveTo(20, rect.height - 30);
      ctx.lineTo(rect.width - 20, rect.height - 30);
      ctx.stroke();
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px system-ui';
      ctx.fillText('Sign above this line', rect.width / 2 - 60, rect.height - 12);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
    };
    const ro = new ResizeObserver(() => initCanvas());
    ro.observe(canvas);
    initCanvas();
    return () => ro.disconnect();
  }, []);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    if (canvasRef.current) {
      signatureDataRef.current = canvasRef.current.toDataURL('image/png');
      setHasSigned(true);
    }
  }, []);

  const clearSignature = () => {
    signatureDataRef.current = '';
    setHasSigned(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.moveTo(20, rect.height - 30);
    ctx.lineTo(rect.width - 20, rect.height - 30);
    ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px system-ui';
    ctx.fillText('Sign above this line', rect.width / 2 - 60, rect.height - 12);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!salonName.trim()) { setError('Please enter your salon name.'); return; }
    if (!signerName.trim()) { setError('Please enter your full legal name.'); return; }
    if (!hasSigned) { setError('Please provide your signature above.'); return; }
    if (!agreedToTerms) { setError('You must agree to the terms of the MOU.'); return; }
    if (!handbookRead) { setError('You must confirm you have read the Partner Handbook.'); return; }

    setSubmitting(true);
    try {
      const signatureData = signatureDataRef.current || canvasRef.current?.toDataURL('image/png');
      const res = await fetch('/api/partners/cosmetology-apprenticeship/sign-mou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_name: salonName,
          signer_name: signerName,
          signer_title: signerTitle,
          supervisor_name: supervisorName,
          supervisor_license: supervisorLicense,
          compensation_model: compensationModel,
          compensation_rate: compensationRate,
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          mou_version: '2025-cosmetology-01',
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to submit MOU');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">MOU Signed Successfully</h1>
          <p className="text-slate-600 mb-6">
            Your Memorandum of Understanding has been submitted. Our team will countersign
            and send you a fully executed copy within 2 business days.
          </p>
          <div className="space-y-3">
            <Link
              href="/partners/cosmetology-apprenticeship/documents"
              className="block w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
            >
              Continue to Required Documents
            </Link>
            <Link
              href="/partners/cosmetology-apprenticeship"
              className="block w-full px-6 py-3 text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-slate-50"
            >
              Back to Partner Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Partners', href: '/partners/cosmetology-apprenticeship' },
          { label: 'Onboarding', href: '/partners/cosmetology-apprenticeship' },
          { label: 'Sign MOU' },
        ]} />
      </div>

      <div className="bg-white border-b border-slate-200 mt-4">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <InstitutionalHeader
            documentType="Memorandum of Understanding"
            title="Indiana Cosmetology Apprenticeship — Worksite Partner Agreement"
            subtitle="USDOL Registered Apprenticeship · RAPIDS Program ID: 2025-IN-132302"
            noDivider
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* MOU Text */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {MOU_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wide">{section.title}</h3>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Salon & Signer Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Salon & Signer Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Salon Legal Name *</label>
                <input required className={inputCls} value={salonName} onChange={e => setSalonName(e.target.value)} placeholder="Legal business name" />
              </div>
              <div>
                <label className={labelCls}>Signer Full Legal Name *</label>
                <input required className={inputCls} value={signerName} onChange={e => setSignerName(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Signer Title *</label>
                <input required className={inputCls} value={signerTitle} onChange={e => setSignerTitle(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Supervising Cosmetologist */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Supervising Cosmetologist</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Supervisor Full Name *</label>
                <input required className={inputCls} value={supervisorName} onChange={e => setSupervisorName(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Indiana Cosmetology License # *</label>
                <input required className={inputCls} value={supervisorLicense} onChange={e => setSupervisorLicense(e.target.value)} placeholder="IPLA license number" />
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Apprentice Compensation</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Compensation Model *</label>
                <select required className={inputCls} value={compensationModel} onChange={e => setCompensationModel(e.target.value)}>
                  <option value="hourly">Hourly Wage</option>
                  <option value="hybrid">Hybrid (Hourly Base + Commission)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Starting Rate *</label>
                <input required className={inputCls} value={compensationRate} onChange={e => setCompensationRate(e.target.value)} placeholder={compensationModel === 'hourly' ? 'e.g. $10.00/hr' : 'e.g. $8.00/hr + 20%'} />
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Digital Signature</h2>
            <p className="text-sm text-slate-500">Draw your signature in the box below using your mouse or finger.</p>
            <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white relative" style={{ height: 160 }}>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <button type="button" onClick={clearSignature} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
              <Eraser className="w-4 h-4" /> Clear signature
            </button>
          </div>

          {/* Acknowledgments */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Acknowledgments</h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 accent-purple-600" checked={handbookRead} onChange={e => setHandbookRead(e.target.checked)} />
              <span className="text-sm text-slate-700">
                I confirm that I have read and understood the{' '}
                <Link href="/partners/cosmetology-apprenticeship/handbook" target="_blank" className="text-purple-600 hover:underline font-medium">
                  Cosmetology Partner Handbook
                </Link>{' '}
                in full prior to signing this MOU.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 accent-purple-600" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} />
              <span className="text-sm text-slate-700">
                I agree to all terms of this Memorandum of Understanding on behalf of the salon named above. I understand this is a legally binding agreement governing a USDOL Registered Apprenticeship worksite.
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !agreedToTerms || !handbookRead}
            className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : 'Sign and Submit MOU'}
          </button>

          <p className="text-center text-slate-500 text-xs">
            Questions?{' '}
            <Link href="/contact" className="text-purple-600 hover:underline">Contact us</Link>{' '}
            or call{' '}
            <a href="tel:3173143757" className="text-purple-600 hover:underline">(317) 314-3757</a>
          </p>
        </form>
      </div>
    </div>
  );
}
