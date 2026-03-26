'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, AlertCircle, Download,
  BookOpen, FileText, ClipboardCheck, ShieldCheck, ArrowRight,
  Upload, CheckCircle2, PenLine, Calendar,
} from 'lucide-react';

// ─── Reusable signature pad ───────────────────────────────────────────────────
function SignaturePad({
  label,
  signerLabel,
  signerName,
  onSignerNameChange,
  canvasRef,
  hasSigned,
  onClear,
  onStartDrawing,
  onDraw,
  onStopDrawing,
  signedAt,
}: {
  label: string;
  signerLabel: string;
  signerName: string;
  onSignerNameChange: (v: string) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  hasSigned: boolean;
  onClear: () => void;
  onStartDrawing: (e: React.MouseEvent | React.TouchEvent) => void;
  onDraw: (e: React.MouseEvent | React.TouchEvent) => void;
  onStopDrawing: () => void;
  signedAt: string | null;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4">
      <div className="flex items-center gap-2">
        <PenLine className="w-4 h-4 text-brand-blue-600" />
        <h3 className="font-semibold text-slate-900 text-sm">{label}</h3>
      </div>

      {/* Signer name */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">{signerLabel} *</label>
        <input
          type="text"
          required
          value={signerName}
          onChange={e => onSignerNameChange(e.target.value)}
          placeholder="Full legal name"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 bg-white"
        />
      </div>

      {/* Canvas */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Draw Signature *</label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-28 cursor-crosshair touch-none"
            onMouseDown={onStartDrawing}
            onMouseMove={onDraw}
            onMouseUp={onStopDrawing}
            onMouseLeave={onStopDrawing}
            onTouchStart={onStartDrawing}
            onTouchMove={onDraw}
            onTouchEnd={onStopDrawing}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          {hasSigned ? (
            <span className="text-xs text-green-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Signature captured
            </span>
          ) : (
            <span className="text-xs text-slate-400">Draw your signature above</span>
          )}
          <button type="button" onClick={onClear} className="text-xs text-slate-400 hover:text-slate-700 underline">
            Clear
          </button>
        </div>
      </div>

      {/* Date */}
      {signedAt && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          Signed: {new Date(signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      )}

      <p className="text-xs text-slate-400 leading-relaxed">
        This electronic signature is legally binding under the Indiana Uniform Electronic Transactions Act (IC 26-2-8) and the federal ESIGN Act.
      </p>
    </div>
  );
}

const compensationModels = [
  { value: 'hourly', label: 'Hourly Wage' },
  { value: 'hybrid', label: 'Hybrid (Hourly Base + Commission)' },
];

const workersCompOptions = [
  { value: 'verified', label: 'Yes — we carry Workers\' Compensation insurance' },
  { value: 'exempt', label: 'Exempt — we have a valid state exemption (will provide documentation)' },
  { value: 'none', label: 'No — we do not currently carry Workers\' Compensation' },
];

const partnerSteps = [
  {
    label: 'Read the Partner Handbook',
    description: 'Understand your responsibilities, policies, and guidelines.',
    href: '/partners/barbershop-apprenticeship/handbook',
    icon: BookOpen,
  },
  {
    label: 'Review Required Forms',
    description: 'See all documents needed before hosting apprentices.',
    href: '/partners/barbershop-apprenticeship/forms',
    icon: FileText,
  },
  {
    label: 'Sign the MOU',
    description: 'Digitally sign the Memorandum of Understanding.',
    href: '/partners/barbershop-apprenticeship/sign-mou',
    icon: ClipboardCheck,
  },
  {
    label: 'Acknowledge Policies',
    description: 'Review and acknowledge all program policies.',
    href: '/partners/barbershop-apprenticeship/policy-acknowledgment',
    icon: ShieldCheck,
  },
];

// ─── Canvas hook factory ──────────────────────────────────────────────────────
function useSignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback(() => setIsDrawing(false), []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  }, []);

  const toDataURL = () => canvasRef.current?.toDataURL('image/png') || '';

  return { canvasRef, hasSigned, startDrawing, draw, stopDrawing, clear, toDataURL };
}

export default function PartnerShopForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Shop identity
    shopLegalName: '',
    shopDbaName: '',
    ownerName: '',
    ein: '',
    einQaNotes: '',
    // Shop physical address (worksite)
    shopPhysicalAddress: '',
    // Contact
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    // Mailing address
    shopAddressLine1: '',
    shopAddressLine2: '',
    shopCity: '',
    shopState: 'IN',
    shopZip: '',
    // License
    indianaShopLicenseNumber: '',
    // Supervisor
    supervisorName: '',
    supervisorLicenseNumber: '',
    supervisorYearsLicensed: '',
    // Employment & compliance
    apprenticesOnPayroll: 'yes',
    compensationModel: '',
    numberOfEmployees: '',
    workersCompStatus: '',
    hasGeneralLiability: '',
    canSuperviseAndVerify: '',
    // Agreements
    mouAcknowledged: false,
    mouSignerName: '',
    employerAcceptanceAcknowledged: false,
    employerAcceptanceSignerName: '',
    consentAcknowledged: false,
    consentSignerName: '',
    // Misc
    notes: '',
    honeypot: '',
  });

  // EIN file upload state
  const [einFile, setEinFile] = useState<File | null>(null);
  const [einFileName, setEinFileName] = useState('');

  // Three separate signature pads
  const mouSig = useSignaturePad();
  const employerSig = useSignaturePad();
  const consentSig = useSignaturePad();

  // Timestamps set when user first draws each signature
  const [mouSignedAt, setMouSignedAt] = useState<string | null>(null);
  const [employerSignedAt, setEmployerSignedAt] = useState<string | null>(null);
  const [consentSignedAt, setConsentSignedAt] = useState<string | null>(null);

  // Wrap draw handlers to capture timestamp on first stroke
  const handleMouDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    mouSig.draw(e);
    if (!mouSignedAt) setMouSignedAt(new Date().toISOString());
  }, [mouSig, mouSignedAt]);

  const handleEmployerDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    employerSig.draw(e);
    if (!employerSignedAt) setEmployerSignedAt(new Date().toISOString());
  }, [employerSig, employerSignedAt]);

  const handleConsentDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    consentSig.draw(e);
    if (!consentSignedAt) setConsentSignedAt(new Date().toISOString());
  }, [consentSig, consentSignedAt]);

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEinFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setEinFile(file);
    setEinFileName(file?.name ?? '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.honeypot) return;

    if (!formData.mouAcknowledged || !formData.mouSignerName.trim()) {
      setError('Please acknowledge the MOU and enter the signer name.');
      return;
    }
    if (!mouSig.hasSigned) {
      setError('Please draw your signature on the MOU.');
      return;
    }
    if (!formData.employerAcceptanceAcknowledged || !formData.employerAcceptanceSignerName.trim()) {
      setError('Please acknowledge the Employer Acceptance Agreement and enter the signer name.');
      return;
    }
    if (!employerSig.hasSigned) {
      setError('Please draw your signature on the Employer Acceptance Agreement.');
      return;
    }
    if (!formData.consentAcknowledged || !formData.consentSignerName.trim()) {
      setError('Please acknowledge the consent and enter the signer name.');
      return;
    }
    if (!consentSig.hasSigned) {
      setError('Please draw your signature on the consent section.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // If EIN file selected, convert to base64 for transmission
      let einFileData: string | null = null;
      if (einFile) {
        einFileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(einFile);
        });
      }

      const response = await fetch('/api/partners/barbershop-apprenticeship/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Legacy field — kept for API backward compat
          signatureData: consentSig.toDataURL(),
          // New signature fields
          mouSignatureData: mouSig.toDataURL(),
          mouSignedAt: mouSignedAt ?? new Date().toISOString(),
          employerAcceptanceSignatureData: employerSig.toDataURL(),
          employerAcceptanceSignedAt: employerSignedAt ?? new Date().toISOString(),
          consentSignatureData: consentSig.toDataURL(),
          consentSignedAt: consentSignedAt ?? new Date().toISOString(),
          // EIN
          einFileData,
          einFileName,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        router.push('/partners/barbershop-apprenticeship/thank-you');
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Unable to submit. Please try again or call (317) 314-3757.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
          {/* Before You Apply checklist */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Before You Apply</h2>
            <p className="text-sm text-slate-500 mb-5">Complete these steps first so you&apos;re ready to submit.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {partnerSteps.map((step) => (
                <Link
                  key={step.href}
                  href={step.href}
                  className="group flex flex-col gap-3 p-4 rounded-lg border border-slate-200 hover:border-brand-blue-300 hover:bg-brand-blue-50/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center group-hover:bg-brand-blue-100 transition-colors">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-900 group-hover:text-brand-blue-700 transition-colors flex items-center gap-1">
                      {step.label}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-brand-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Shop Information */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Shop Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shop Legal Name *</label>
                  <input type="text" required value={formData.shopLegalName} onChange={e => updateField('shopLegalName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">DBA Name (if different)</label>
                  <input type="text" value={formData.shopDbaName} onChange={e => updateField('shopDbaName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name *</label>
                  <input type="text" required value={formData.ownerName} onChange={e => updateField('ownerName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>

                {/* Indiana Shop License — full copy required */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Indiana Shop License # *</label>
                  <input type="text" required value={formData.indianaShopLicenseNumber} onChange={e => updateField('indianaShopLicenseNumber', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-2 leading-relaxed">
                    ⚠️ <strong>Full copy required.</strong> You must upload a complete copy of your Indiana barbershop license showing the license number, expiration date, licensee name, and shop address. Partial copies or photos that cut off any portion of the license will not be accepted.
                  </p>
                </div>

                {/* EIN */}
                <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Employer Identification Number (EIN)</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Required for DOL RAPIDS worksite registration. Enter your EIN and upload your IRS confirmation letter (CP-575 or 147C). The name on the EIN must match your shop legal name above.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">EIN (XX-XXXXXXX) *</label>
                      <input
                        type="text"
                        required
                        value={formData.ein}
                        onChange={e => updateField('ein', e.target.value)}
                        placeholder="12-3456789"
                        pattern="\d{2}-\d{7}"
                        title="Enter EIN in format XX-XXXXXXX"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Upload EIN Paperwork *
                      </label>
                      <label className="flex items-center gap-3 w-full px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 truncate">
                          {einFileName || 'Choose file (PDF or image)'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleEinFileChange}
                          className="sr-only"
                        />
                      </label>
                      {einFile && (
                        <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {einFileName}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">IRS CP-575 or 147C letter — full document, no crops</p>
                    </div>
                  </div>
                  {/* EIN QA notes */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">EIN Notes (optional)</label>
                    <textarea
                      rows={2}
                      value={formData.einQaNotes}
                      onChange={e => updateField('einQaNotes', e.target.value)}
                      placeholder="e.g. EIN is under the LLC name, not the DBA — or — sole proprietor using SSN (attach W-9)"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Shop physical address (worksite) */}
                <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Shop Physical / Worksite Address *
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    The street address where apprentices will perform on-the-job training. This is registered as the worksite in the federal RAPIDS system.
                  </p>
                  <input
                    type="text"
                    required
                    value={formData.shopPhysicalAddress}
                    onChange={e => updateField('shopPhysicalAddress', e.target.value)}
                    placeholder="e.g. 1234 Main St, Indianapolis, IN 46204"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Primary Contact Name *</label>
                  <input type="text" required value={formData.contactName} onChange={e => updateField('contactName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input type="email" required value={formData.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                  <input type="tel" required value={formData.contactPhone} onChange={e => updateField('contactPhone', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Shop Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1 *</label>
                  <input type="text" required value={formData.shopAddressLine1} onChange={e => updateField('shopAddressLine1', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label>
                  <input type="text" value={formData.shopAddressLine2} onChange={e => updateField('shopAddressLine2', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                    <input type="text" required value={formData.shopCity} onChange={e => updateField('shopCity', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input type="text" value="Indiana" disabled className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ZIP *</label>
                    <input type="text" required value={formData.shopZip} onChange={e => updateField('shopZip', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Supervising Barber */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Supervising Barber</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor Name *</label>
                  <input type="text" required value={formData.supervisorName} onChange={e => updateField('supervisorName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor License # *</label>
                  <input type="text" required value={formData.supervisorLicenseNumber} onChange={e => updateField('supervisorLicenseNumber', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Years Licensed</label>
                  <input type="number" min="0" value={formData.supervisorYearsLicensed} onChange={e => updateField('supervisorYearsLicensed', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
              </div>
            </div>

            {/* Employment & Compliance */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Employment & Compliance</h2>
              <p className="text-sm text-slate-500 mb-6">
                As a DOL Registered Apprenticeship, apprentices must be employed by the host shop.
                Elevate (as the registered sponsor) will register approved apprentices and employer
                worksites in the federal RAPIDS system after compliance verification.
              </p>
              <div className="space-y-6">
                {/* Payroll confirmation */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Will apprentices be added to your payroll as employees? *
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    DOL Registered Apprenticeships require the apprentice to be an employee of the host shop,
                    regardless of compensation model (hourly or hybrid). Sole commission is not permitted.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-white">
                      <input type="radio" name="apprenticesOnPayroll" value="yes" checked={formData.apprenticesOnPayroll === 'yes'} onChange={e => updateField('apprenticesOnPayroll', e.target.value)} required className="text-brand-blue-600" />
                      <span className="text-slate-700">Yes — apprentices will be on our payroll</span>
                    </label>
                  </div>
                  <p className="text-xs text-amber-700 mt-2">
                    Shops that cannot add apprentices to payroll are not eligible to host registered apprenticeship OJL.
                  </p>
                </div>

                {/* Compensation model */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Compensation Model *</label>
                  <div className="grid md:grid-cols-3 gap-2">
                    {compensationModels.map(model => (
                      <label key={model.value} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-white">
                        <input type="radio" name="compensationModel" value={model.value} checked={formData.compensationModel === model.value} onChange={e => updateField('compensationModel', e.target.value)} required className="text-brand-blue-600" />
                        <span className="text-slate-700">{model.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Number of employees */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Total Number of Employees (including owner) *</label>
                  <input type="number" min="1" value={formData.numberOfEmployees} onChange={e => updateField('numberOfEmployees', e.target.value)} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="e.g. 3" />
                </div>

                {/* General Liability */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Do you carry General Liability insurance? *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="hasGeneralLiability" value="yes" checked={formData.hasGeneralLiability === 'yes'} onChange={e => updateField('hasGeneralLiability', e.target.value)} required />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="hasGeneralLiability" value="no" checked={formData.hasGeneralLiability === 'no'} onChange={e => updateField('hasGeneralLiability', e.target.value)} />
                      <span>No</span>
                    </label>
                  </div>
                  {formData.hasGeneralLiability === 'no' && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      General Liability insurance is required to host apprentices at your worksite.
                    </p>
                  )}
                </div>

                {/* Workers' Compensation */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Workers&apos; Compensation Status *</label>
                  <div className="space-y-2">
                    {workersCompOptions.map(opt => (
                      <label key={opt.value} className="flex items-start gap-2 p-3 border rounded-lg cursor-pointer hover:bg-white">
                        <input type="radio" name="workersCompStatus" value={opt.value} checked={formData.workersCompStatus === opt.value} onChange={e => updateField('workersCompStatus', e.target.value)} required className="mt-0.5 text-brand-blue-600" />
                        <span className="text-slate-700 text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {formData.workersCompStatus === 'none' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">Workers&apos; Compensation is required for shops with employees on payroll.</p>
                      <p className="text-xs text-red-600 mt-1">
                        Elevate cannot register apprentices in the federal RAPIDS system under a partner
                        worksite that does not meet minimum insurance and compliance standards.
                      </p>
                    </div>
                  )}
                  {formData.workersCompStatus === 'exempt' && (
                    <p className="text-sm text-amber-700 mt-2">
                      You will need to provide documentation of your state exemption during the compliance review.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Can you commit to supervising apprentices and verifying hours/competencies? *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="canSuperviseAndVerify" value="yes" checked={formData.canSuperviseAndVerify === 'yes'} onChange={e => updateField('canSuperviseAndVerify', e.target.value)} required />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="canSuperviseAndVerify" value="no" checked={formData.canSuperviseAndVerify === 'no'} onChange={e => updateField('canSuperviseAndVerify', e.target.value)} />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Additional Information</h2>
              <textarea rows={4} value={formData.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Any additional information you'd like to share..." className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
            </div>

            {/* ── MOU ─────────────────────────────────────────────────────── */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Memorandum of Understanding (MOU)</h2>
              <p className="text-sm text-slate-500 mb-4">
                Review the MOU before signing. This document governs your responsibilities as a DOL Registered Apprenticeship partner shop.
              </p>
              <div className="p-4 bg-brand-blue-50 border border-brand-blue-200 rounded-lg mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.mouAcknowledged}
                    onChange={e => updateField('mouAcknowledged', e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-700">
                    I have read and agree to the{' '}
                    <Link href="/docs/Indiana-Barbershop-Apprenticeship-MOU" className="text-brand-blue-600 underline font-medium" target="_blank">
                      Memorandum of Understanding (MOU)
                    </Link>{' '}
                    and understand it is a binding agreement required to participate as a partner shop. *
                  </span>
                </label>
              </div>
              <SignaturePad
                label="MOU Signature"
                signerLabel="MOU Signer Full Name"
                signerName={formData.mouSignerName}
                onSignerNameChange={v => updateField('mouSignerName', v)}
                canvasRef={mouSig.canvasRef}
                hasSigned={mouSig.hasSigned}
                onClear={() => { mouSig.clear(); setMouSignedAt(null); }}
                onStartDrawing={mouSig.startDrawing}
                onDraw={handleMouDraw}
                onStopDrawing={mouSig.stopDrawing}
                signedAt={mouSignedAt}
              />
            </div>

            {/* ── Employer Acceptance Agreement ────────────────────────────── */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Employer Acceptance Agreement</h2>
              <p className="text-sm text-slate-500 mb-4">
                As the employing shop, you accept responsibility for the apprentice as an employee, agree to pay at least minimum wage, maintain required insurance, and comply with all DOL Registered Apprenticeship standards for the duration of the apprenticeship.
              </p>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4 space-y-2 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">By signing, the employer agrees to:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 ml-1">
                  <li>Add the apprentice to payroll as a W-2 employee</li>
                  <li>Pay at least Indiana minimum wage ($7.25/hr) throughout the apprenticeship</li>
                  <li>Maintain active Workers&apos; Compensation and General Liability insurance</li>
                  <li>Designate a licensed supervising barber for all OJL hours</li>
                  <li>Verify and sign off on apprentice competency log entries</li>
                  <li>Cooperate with DOL RAPIDS reporting and any compliance audits</li>
                  <li>Notify Elevate for Humanity within 5 business days of any change in employment status</li>
                </ul>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-lg mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.employerAcceptanceAcknowledged}
                    onChange={e => updateField('employerAcceptanceAcknowledged', e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-700">
                    I accept the Employer Acceptance Agreement and confirm that I have the authority to bind this business to these obligations. *
                  </span>
                </label>
              </div>
              <SignaturePad
                label="Employer Acceptance Signature"
                signerLabel="Authorized Signer Full Name"
                signerName={formData.employerAcceptanceSignerName}
                onSignerNameChange={v => updateField('employerAcceptanceSignerName', v)}
                canvasRef={employerSig.canvasRef}
                hasSigned={employerSig.hasSigned}
                onClear={() => { employerSig.clear(); setEmployerSignedAt(null); }}
                onStartDrawing={employerSig.startDrawing}
                onDraw={handleEmployerDraw}
                onStopDrawing={employerSig.stopDrawing}
                signedAt={employerSignedAt}
              />
            </div>

            {/* ── Application Consent ──────────────────────────────────────── */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Application Consent & Certification</h2>
              <p className="text-sm text-slate-500 mb-4">
                Certify that all information in this application is accurate and consent to contact.
              </p>
              <div className="p-4 bg-white border border-slate-200 rounded-lg mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.consentAcknowledged}
                    onChange={e => updateField('consentAcknowledged', e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-700">
                    I certify that all information provided in this application is true and accurate. I consent to be contacted regarding this application and acknowledge that my information will be handled per the{' '}
                    <Link href="/privacy-policy" className="text-brand-blue-600 underline">Privacy Policy</Link>. *
                  </span>
                </label>
              </div>
              <SignaturePad
                label="Application Signature"
                signerLabel="Applicant Full Name"
                signerName={formData.consentSignerName}
                onSignerNameChange={v => updateField('consentSignerName', v)}
                canvasRef={consentSig.canvasRef}
                hasSigned={consentSig.hasSigned}
                onClear={() => { consentSig.clear(); setConsentSignedAt(null); }}
                onStartDrawing={consentSig.startDrawing}
                onDraw={handleConsentDraw}
                onStopDrawing={consentSig.stopDrawing}
                signedAt={consentSignedAt}
              />
            </div>

            {/* Honeypot */}
            <input type="text" name="website" value={formData.honeypot} onChange={e => updateField('honeypot', e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button type="submit" disabled={loading} className="flex-1 inline-flex items-center justify-center px-8 py-4 bg-brand-blue-600 text-white rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-50 transition-colors">
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</> : 'Submit Application'}
              </button>
              <Link href="/docs/Indiana-Barbershop-Apprenticeship-MOU" className="inline-flex items-center justify-center px-6 py-4 border border-slate-300 rounded-lg font-medium hover:bg-white" target="_blank">
                <Download className="w-5 h-5 mr-2" /> View MOU
              </Link>
            </div>
          </form>
    </div>
  );
}
