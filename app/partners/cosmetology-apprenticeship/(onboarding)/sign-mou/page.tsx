'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, CheckCircle2, Eraser, Send, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';

const MOU_SECTIONS = [
  {
    title: '1. Parties and Purpose',
    content: `This MOU is between 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Technical Institute ("Sponsor") and the salon identified at execution ("Host Salon").

This MOU establishes the terms under which the Host Salon will serve as a worksite for the Indiana Cosmetology Apprenticeship Program, a USDOL Registered Apprenticeship sponsored by Elevate for Humanity.

This is a worksite hosting agreement. The Host Salon is not a co-owner, revenue-sharing partner, or program delivery site for any other Elevate program.`,
  },
  {
    title: '2. Program Structure',
    content: `The Indiana Cosmetology Apprenticeship Program is a USDOL Registered Apprenticeship. Its structure is set by federal law and registered program standards.

Requirements:
• 2,000 hours of on-the-job training (OJT) at the worksite, supervised by a licensed cosmetologist
• Related Technical Instruction (RTI) coordinated by the Sponsor
• Progressive skill development tracked through competency assessments
• Apprentice must be registered with USDOL/RAPIDS before OJT hours begin
• All OJT hours must be documented and submitted to the Sponsor monthly

The Sponsor maintains sole authority over RTI curriculum, competency standards, RAPIDS registration, and certificate issuance.`,
  },
  {
    title: '3. Sponsor Responsibilities',
    content: `Elevate for Humanity agrees to:
• Maintain USDOL/RAPIDS registration and all required federal reporting
• Develop, deliver, and update all Related Technical Instruction (RTI)
• Maintain official apprentice records and program documentation
• Issue completion certificates upon successful program completion
• Screen and refer qualified apprentice candidates to the Host Salon
• Provide competency checklists and OJT tracking tools
• Conduct periodic worksite visits to verify program compliance`,
  },
  {
    title: '4. Host Salon Responsibilities',
    content: `The Host Salon agrees to:

SUPERVISION: Provide direct on-site supervision by a currently licensed Indiana cosmetologist at all times during OJT hours.

EMPLOYMENT: The apprentice is a paid employee of the Host Salon — not a volunteer or independent contractor. The Host Salon is the employer of record and is responsible for payroll, withholding, and workers' compensation.

WAGES: Pay the apprentice per the agreed progressive wage schedule. Failure to pay is grounds for immediate termination.

HOURS TRACKING: Accurately track and submit OJT hours monthly. Falsifying hours is a federal offense.

SAFETY: Maintain OSHA-compliant workplace. Report any apprentice injury within 24 hours.

INSURANCE: Carry workers' compensation covering the apprentice before OJT begins.

LICENSES: Maintain all required salon licenses and IPLA permits throughout the MOU term.

NONDISCRIMINATION: Comply with WIOA Section 188, Title VI, ADA, and all equal opportunity laws.`,
  },
  {
    title: '5. Apprentice Compensation',
    content: `The apprentice is a paid employee. Commission-only compensation is prohibited under federal apprenticeship rules.

Approved models:
• HOURLY: $10.00–$15.00/hr recommended. Must meet Indiana minimum wage ($7.25/hr) at all times.
• HYBRID: $8.00–$10.00/hr base wage PLUS 15%–25% commission on services performed.

Progressive wage increases are required as the apprentice advances. Apprentices retain 100% of tips.`,
  },
  {
    title: '6. Term and Termination',
    content: `This MOU is effective from the date signed and continues until program completion or termination.

Either party may terminate with 30 days written notice for any reason.

The Sponsor may terminate immediately (no notice) if the Host Salon fails to pay the apprentice, violates safety requirements, loses required licenses or insurance, falsifies OJT records, or violates nondiscrimination requirements.`,
  },
  {
    title: '7. Confidentiality',
    content: `Both parties agree to maintain confidentiality of apprentice PII per applicable privacy laws. The Host Salon may not disclose apprentice information to third parties without written consent.

The Host Salon also receives access to Elevate's operational procedures and program materials. This information is confidential and may not be used for any purpose other than fulfilling obligations under this MOU.`,
  },
  {
    title: '8. Non-Compete and Non-Replication',
    content: `During the term and for three (3) years following termination, the Host Salon agrees not to use Elevate's program structure, RAPIDS registration, or DWD relationships to independently register or operate a competing USDOL Registered Apprenticeship in cosmetology, or to solicit Elevate apprentice candidates into a competing program.`,
  },
  {
    title: '9. Partner Handbook',
    content: `The Worksite Partner Handbook is incorporated by reference into this MOU. By signing, the Host Salon confirms it has read and understood the Handbook in full prior to signing.

Available at: elevateforhumanity.org/partners/cosmetology-apprenticeship/handbook

Failure to comply with Handbook standards constitutes a breach of this MOU.`,
  },
  {
    title: '10. Dispute Resolution',
    content: `Disputes shall first be resolved through good-faith negotiation. If unresolved within 15 business days, either party may submit to mediation. This MOU is governed by the laws of the State of Indiana, with jurisdiction in Marion County.`,
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
  const [handbookRead, setHandbookRead] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [salonName, setSalonName] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('Owner');
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorLicense, setSupervisorLicense] = useState('');
  const [compensationModel, setCompensationModel] = useState('hourly');
  const [compensationRate, setCompensationRate] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    fetch('/api/partners/cosmetology-apprenticeship/my-application')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (data.salon_legal_name) setSalonName(data.salon_legal_name);
        if (data.owner_name)       setSignerName(data.owner_name);
        if (data.contact_email)    setContactEmail(data.contact_email);
        if (data.supervisor_name)  setSupervisorName(data.supervisor_name);
        if (data.supervisor_license_number) setSupervisorLicense(data.supervisor_license_number);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const init = () => {
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
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
    };
    const ro = new ResizeObserver(() => init());
    ro.observe(canvas);
    init();
    return () => ro.disconnect();
  }, []);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
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
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!salonName.trim())      return setError('Please enter your salon name.');
    if (!signerName.trim())     return setError('Please enter your full legal name.');
    if (!supervisorName.trim()) return setError('Please enter your supervising cosmetologist name.');
    if (!supervisorLicense.trim()) return setError('Please enter the IPLA license number.');
    if (!hasSigned)             return setError('Please provide your signature.');
    if (!agreedToTerms)         return setError('You must agree to the terms of the MOU.');

    setSubmitting(true);
    try {
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
          signature_data: signatureDataRef.current || canvasRef.current?.toDataURL('image/png'),
          signed_at: new Date().toISOString(),
          mou_version: '2025-cosmo-01',
          contact_email: contactEmail,
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
          <CheckCircle2 className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">MOU Signed Successfully</h1>
          <p className="text-gray-600 mb-6">
            Your MOU has been submitted. Our team will countersign and send you a fully executed copy within 2 business days.
          </p>
          <div className="space-y-3">
            <Link href="/partners/cosmetology-apprenticeship/forms"
              className="block w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">
              Continue to Required Forms
            </Link>
            <Link href="/partners/cosmetology-apprenticeship"
              className="block w-full px-6 py-3 text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
              Back to Partner Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners/cosmetology-apprenticeship' }, { label: 'Sign MOU' }]} />
        <Link href="/partners/cosmetology-apprenticeship" className="inline-flex items-center gap-1 text-gray-600 hover:text-purple-700 text-sm mt-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Partner Page
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-8">

        {/* Handbook prerequisite */}
        <div className={`rounded-xl border-2 p-5 mb-8 ${handbookRead ? 'border-green-400 bg-green-50' : 'border-amber-400 bg-amber-50'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${handbookRead ? 'bg-green-100' : 'bg-amber-100'}`}>
              {handbookRead ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <AlertCircle className="w-6 h-6 text-amber-600" />}
            </div>
            <div className="flex-1">
              <p className={`font-bold text-base mb-1 ${handbookRead ? 'text-green-900' : 'text-amber-900'}`}>
                {handbookRead ? 'Handbook reviewed — you may proceed' : 'Step 1: Read the Partner Handbook before signing'}
              </p>
              <p className={`text-sm mb-3 ${handbookRead ? 'text-green-800' : 'text-amber-800'}`}>
                The Partner Handbook explains your responsibilities as a host salon, compensation requirements, hour tracking, and prohibited practices.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/partners/cosmetology-apprenticeship/handbook" target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-amber-400 text-amber-800 rounded-lg text-sm font-semibold hover:bg-amber-50">
                  <FileText className="w-4 h-4" /> Open Partner Handbook
                </Link>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={handbookRead} onChange={e => setHandbookRead(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm font-semibold text-gray-900">I have read and understood the Partner Handbook</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* MOU Content */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b">
            <InstitutionalHeader documentType="Memorandum of Understanding" title="Indiana Cosmetology Apprenticeship Program" subtitle="Worksite Partner Agreement" noDivider />
            <div className="text-sm text-gray-600 border-t border-slate-200 pt-4 mt-2">
              <p><strong>Between:</strong> 2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Technical Institute (&ldquo;Sponsor&rdquo;)</p>
              <p><strong>And:</strong> Your salon (&ldquo;Host Salon&rdquo;)</p>
            </div>
          </div>
          <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
            {MOU_SECTIONS.map(s => (
              <div key={s.title}>
                <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{s.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Salon Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salon Name *</label>
              <input type="text" required value={salonName} onChange={e => setSalonName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Your Salon Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Legal Name *</label>
              <input type="text" required value={signerName} onChange={e => setSignerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Full legal name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Title *</label>
              <input type="text" required value={signerTitle} onChange={e => setSignerTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Owner, Manager, etc." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
              <input type="email" required value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supervising Cosmetologist Name *</label>
              <input type="text" required value={supervisorName} onChange={e => setSupervisorName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Licensed cosmetologist who will supervise" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor IPLA License # *</label>
              <input type="text" required value={supervisorLicense} onChange={e => setSupervisorLicense(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Indiana IPLA license number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compensation Model *</label>
              <select required value={compensationModel} onChange={e => setCompensationModel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="hourly">Hourly Wage ($10.00–$15.00/hr recommended)</option>
                <option value="hybrid">Hybrid ($8–$10/hr base + 15%–25% commission)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Rate *</label>
              <input type="text" required value={compensationRate} onChange={e => setCompensationRate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder={compensationModel === 'hourly' ? '$12.00/hour' : '$9.00/hour + 20% commission'} />
            </div>
          </div>
        </div>

        {/* Signature blocks */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Signatures</h2>
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Sponsor — Already Signed</p>
              <div className="border-b border-gray-400 pb-2 mb-3">
                <span style={{fontFamily:'Georgia,serif',fontSize:'24px',color:'#1a1a2e',fontStyle:'italic'}}>Elizabeth Greene</span>
              </div>
              <p className="text-xs text-gray-600"><strong>Name:</strong> Elizabeth Greene</p>
              <p className="text-xs text-gray-600"><strong>Title:</strong> Founder &amp; CEO</p>
              <p className="text-xs text-gray-600"><strong>Date:</strong> {new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
              <div className="mt-3 bg-green-50 border border-green-200 rounded px-3 py-1.5 text-xs text-green-700 font-semibold text-center">✓ Signed by Elevate for Humanity</div>
            </div>
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-3">Host Salon — Your Signature Required</p>
              <div className="border-b border-dashed border-purple-400 pb-2 mb-3 min-h-[32px]">
                <span className="text-sm text-purple-400 italic">Draw your signature below</span>
              </div>
              <p className="text-xs text-gray-600"><strong>Name:</strong> {signerName || '—'}</p>
              <p className="text-xs text-gray-600"><strong>Salon:</strong> {salonName || '—'}</p>
              <p className="text-xs text-gray-600"><strong>Date:</strong> {new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
              <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded px-3 py-1.5 text-xs text-yellow-700 font-semibold text-center">⚠ Awaiting your signature</div>
            </div>
          </div>
        </div>

        {/* Signature canvas */}
        <div className={`bg-white rounded-xl shadow-sm border p-6 mb-8 ${!handbookRead ? 'opacity-50 pointer-events-none select-none' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Draw Your Signature</h2>
            <button type="button" onClick={clearSignature} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <Eraser className="w-4 h-4" /> Clear
            </button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
            <canvas ref={canvasRef} className="w-full cursor-crosshair touch-none" style={{height:'180px'}}
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
              onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
          </div>
          {hasSigned && <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Signature captured</p>}
        </div>

        {/* Agreement checkbox */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
            <span className="text-sm text-gray-700">
              I have read and agree to the terms of this MOU. I confirm I am authorized to sign on behalf of the salon named above.
              I understand this is a legally binding agreement and that my digital signature has the same legal effect as a handwritten signature.
              I acknowledge I have reviewed the{' '}
              <Link href="/partners/cosmetology-apprenticeship/handbook" className="text-purple-600 underline">Partner Handbook</Link>. *
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button type="submit"
            disabled={submitting || !handbookRead || !salonName.trim() || !signerName.trim() || !hasSigned || !agreedToTerms}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-lg font-bold text-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><Send className="w-5 h-5" /> Sign &amp; Submit MOU</>}
          </button>
          <Link href="/partners/cosmetology-apprenticeship"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
            Cancel
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          By submitting, you agree your electronic signature is legally binding under the Indiana Uniform Electronic Transactions Act (IC 26-2-8) and the federal ESIGN Act.
        </p>
      </form>
    </div>
  );
}
