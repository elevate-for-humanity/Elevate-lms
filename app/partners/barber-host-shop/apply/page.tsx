'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Loader2, AlertCircle, Download,
  BookOpen, FileText, ClipboardCheck, ShieldCheck, ArrowRight, Upload,
} from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

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
    href: '/partners/barber-host-shop/handbook',
    icon: BookOpen,
  },
  {
    label: 'Review Required Forms',
    description: 'See all documents needed before hosting apprentices.',
    href: '/partners/barber-host-shop/forms',
    icon: FileText,
  },
  {
    label: 'Sign the MOU',
    description: 'Digitally sign the Memorandum of Understanding.',
    href: '/partners/barber-host-shop/sign-mou',
    icon: ClipboardCheck,
  },
  {
    label: 'Acknowledge Policies',
    description: 'Review and acknowledge all program policies.',
    href: '/partners/barber-host-shop/policy-acknowledgment',
    icon: ShieldCheck,
  },
];

export default function BarbershopPartnerApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [einFile, setEinFile] = useState<File | null>(null);
  const [einFileName, setEinFileName] = useState('');
  const [shopLicenseFile, setShopLicenseFile] = useState<File | null>(null);
  const [shopLicenseFileName, setShopLicenseFileName] = useState('');
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [insuranceFileName, setInsuranceFileName] = useState('');
  const [formData, setFormData] = useState({
    shopLegalName: '',
    shopDbaName: '',
    ownerName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    shopAddressLine1: '',
    shopAddressLine2: '',
    shopCity: '',
    shopState: 'IN',
    shopZip: '',
    indianaShopLicenseNumber: '',
    supervisorName: '',
    supervisorLicenseNumber: '',
    supervisorYearsLicensed: '',
    apprenticesOnPayroll: 'yes',
    compensationModel: '',
    numberOfEmployees: '',
    workersCompStatus: '',
    hasGeneralLiability: '',
    canSuperviseAndVerify: '',
    ein: '',
    einQaNotes: '',
    mouAcknowledged: false,
    consentAcknowledged: false,
    notes: '',
    honeypot: '',
  });

  // Signature canvas
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

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  }, []);

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.honeypot) return;

    if (!formData.mouAcknowledged || !formData.consentAcknowledged) {
      setError('Please acknowledge both the MOU and consent checkboxes.');
      return;
    }

    if (!hasSigned) {
      setError('Please provide your signature before submitting.');
      return;
    }

    if (formData.canSuperviseAndVerify !== 'yes') {
      setError('You must have a licensed supervising barber who can verify apprentice hours.');
      return;
    }
    if (formData.hasGeneralLiability !== 'yes') {
      setError('General liability insurance is required for partner barbershops.');
      return;
    }
    if (formData.workersCompStatus === 'none') {
      setError("Workers' compensation coverage or a valid exemption is required.");
      return;
    }
    if (!shopLicenseFile) {
      setError('Please upload your Indiana barbershop license.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const signatureData = canvasRef.current?.toDataURL('image/png') || '';

      // Upload EIN document if provided
      let einDocumentUrl = '';
      if (einFile) {
        const fd = new FormData();
        fd.append('file', einFile);
        fd.append('type', 'ein_document');
        const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: fd });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          einDocumentUrl = uploadData.url ?? '';
        }
      }

      const encodeFile = async (file: File | null): Promise<string> => {
        if (!file) return '';
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.readAsDataURL(file);
        });
      };

      const shopLicenseFileData = await encodeFile(shopLicenseFile);
      const insuranceFileData = await encodeFile(insuranceFile);

      const response = await fetch('/api/partners/barber-host-shop/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          signatureData,
          einDocumentUrl,
          shopLicenseFileData,
          shopLicenseFileName,
          insuranceFileData,
          insuranceFileName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      if (!result.applicationId) {
        setError(`Application could not be confirmed. Please call ${PLATFORM_DEFAULTS.supportPhone}.`);
        setLoading(false);
        return;
      }

      router.push('/partners/barber-host-shop/thank-you');
    } catch {
      setError(`Unable to submit. Please try again or call ${PLATFORM_DEFAULTS.supportPhone}.`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Barbershop', href: '/partners/barber-host-shop' }, { label: 'Apply' }]} />
      </div>

      {/* Hero */}
      <section className="py-6 border-b">
        <div className="max-w-5xl mx-auto px-4">
          <Link href="/partners/barber-host-shop" className="inline-flex items-center gap-1 text-black hover:text-brand-blue-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Partner Information
          </Link>
          <InstitutionalHeader
            documentType="Partner Application"
            title="Barbershop Worksite Partner Application"
            subtitle="Complete this form to apply as a worksite partner for the Indiana Barber Apprenticeship program."
            noDivider
          />
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4">
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
                  <label className="block text-sm font-medium text-slate-900 mb-1">Shop Legal Name *</label>
                  <input type="text" required value={formData.shopLegalName} onChange={e => updateField('shopLegalName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">DBA Name (if different)</label>
                  <input type="text" value={formData.shopDbaName} onChange={e => updateField('shopDbaName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Owner Name *</label>
                  <input type="text" required value={formData.ownerName} onChange={e => updateField('ownerName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Indiana Shop License # *</label>
                  <input type="text" required value={formData.indianaShopLicenseNumber} onChange={e => updateField('indianaShopLicenseNumber', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Shop Name (customer-facing name)</label>
                  <input type="text" value={formData.shopDbaName} onChange={e => updateField('shopDbaName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Compliance Uploads</h2>
              <p className="text-sm text-slate-600 mb-5">
                Upload required compliance documents. Missing insurance documentation will place
                your application on approval hold, but you can still submit.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Barbershop License Upload *</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setShopLicenseFile(f);
                      setShopLicenseFileName(f?.name || '');
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                  {shopLicenseFileName && <p className="text-xs text-slate-600 mt-1">{shopLicenseFileName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Insurance COI Upload (optional)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setInsuranceFile(f);
                      setInsuranceFileName(f?.name || '');
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                  {insuranceFileName && <p className="text-xs text-slate-600 mt-1">{insuranceFileName}</p>}
                  <p className="text-xs text-amber-700 mt-1">No COI = application can submit but will not be approved until uploaded.</p>
                </div>
              </div>
            </div>

            {/* EIN */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Employer Identification Number (EIN)</h2>
              <p className="text-sm text-slate-600 mb-6">
                Required for DOL RAPIDS registration. Your EIN is used only for federal apprenticeship compliance — it is never shared or used for any other purpose.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">EIN *</label>
                  <input
                    type="text"
                    required
                    placeholder="XX-XXXXXXX"
                    value={formData.ein}
                    onChange={e => updateField('ein', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Upload EIN Document (optional)</label>
                  <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 truncate">
                      {einFileName || 'Choose file (PDF, JPG, PNG)'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0] ?? null;
                        setEinFile(file);
                        setEinFileName(file?.name ?? '');
                      }}
                    />
                  </label>
                  {einFileName && (
                    <p className="text-xs text-brand-green-700 mt-1 flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-brand-blue-600 inline-block flex-shrink-0" aria-hidden="true" /> {einFileName} selected
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 mb-1">EIN Notes (optional)</label>
                  <input
                    type="text"
                    value={formData.einQaNotes}
                    onChange={e => updateField('einQaNotes', e.target.value)}
                    placeholder="e.g. Sole proprietor — SSN used as EIN"
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
                  <label className="block text-sm font-medium text-slate-900 mb-1">Primary Contact Name *</label>
                  <input type="text" required value={formData.contactName} onChange={e => updateField('contactName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Email *</label>
                  <input type="email" required value={formData.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 mb-1">Phone *</label>
                  <input type="tel" required value={formData.contactPhone} onChange={e => updateField('contactPhone', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Shop Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Address Line 1 *</label>
                  <input type="text" required value={formData.shopAddressLine1} onChange={e => updateField('shopAddressLine1', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Address Line 2</label>
                  <input type="text" value={formData.shopAddressLine2} onChange={e => updateField('shopAddressLine2', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">City *</label>
                    <input type="text" required value={formData.shopCity} onChange={e => updateField('shopCity', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">State</label>
                    <input type="text" value="Indiana" disabled className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">ZIP *</label>
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
                  <label className="block text-sm font-medium text-slate-900 mb-1">Supervisor Name *</label>
                  <input type="text" required value={formData.supervisorName} onChange={e => updateField('supervisorName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Supervisor License # *</label>
                  <input type="text" required value={formData.supervisorLicenseNumber} onChange={e => updateField('supervisorLicenseNumber', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Years Licensed</label>
                  <input type="number" min="0" value={formData.supervisorYearsLicensed} onChange={e => updateField('supervisorYearsLicensed', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
              </div>
            </div>

            {/* Employment & Compliance */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Employment & Compliance</h2>
              <p className="text-sm text-black mb-6">
                As a DOL Registered Apprenticeship, apprentices must be employed by the host shop.
                Elevate (as the registered sponsor) will register approved apprentices and employer
                worksites in the federal RAPIDS system after compliance verification.
              </p>
              <div className="space-y-6">
                {/* Payroll confirmation */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Will apprentices be added to your payroll as employees? *
                  </label>
                  <p className="text-xs text-black mb-2">
                    DOL Registered Apprenticeships require the apprentice to be an employee of the host shop,
                    regardless of compensation model (hourly or hybrid). Sole commission is not permitted.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-white">
                      <input type="radio" name="apprenticesOnPayroll" value="yes" checked={formData.apprenticesOnPayroll === 'yes'} onChange={e => updateField('apprenticesOnPayroll', e.target.value)} required className="text-brand-blue-600" />
                      <span className="text-slate-900">Yes — apprentices will be on our payroll</span>
                    </label>
                  </div>
                  <p className="text-xs text-amber-700 mt-2">
                    Shops that cannot add apprentices to payroll are not eligible to host registered apprenticeship OJL.
                  </p>
                </div>

                {/* Compensation model */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Compensation Model *</label>
                  <div className="grid md:grid-cols-3 gap-2">
                    {compensationModels.map(model => (
                      <label key={model.value} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-white">
                        <input type="radio" name="compensationModel" value={model.value} checked={formData.compensationModel === model.value} onChange={e => updateField('compensationModel', e.target.value)} required className="text-brand-blue-600" />
                        <span className="text-slate-900">{model.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Number of employees */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Total Number of Employees (including owner) *</label>
                  <input type="number" min="1" value={formData.numberOfEmployees} onChange={e => updateField('numberOfEmployees', e.target.value)} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="e.g. 3" />
                </div>

                {/* General Liability */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Do you carry General Liability insurance? *</label>
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
                  <label className="block text-sm font-medium text-slate-900 mb-2">Workers&apos; Compensation Status *</label>
                  <div className="space-y-2">
                    {workersCompOptions.map(opt => (
                      <label key={opt.value} className="flex items-start gap-2 p-3 border rounded-lg cursor-pointer hover:bg-white">
                        <input type="radio" name="workersCompStatus" value={opt.value} checked={formData.workersCompStatus === opt.value} onChange={e => updateField('workersCompStatus', e.target.value)} required className="mt-0.5 text-brand-blue-600" />
                        <span className="text-slate-900 text-sm">{opt.label}</span>
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
                  <label className="block text-sm font-medium text-slate-900 mb-2">Can you commit to supervising apprentices and verifying hours/competencies? *</label>
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

            {/* Acknowledgments */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Acknowledgments</h2>
              <div className="space-y-4">
                <div className="p-4 bg-brand-blue-50 border border-brand-blue-200 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.mouAcknowledged} onChange={e => updateField('mouAcknowledged', e.target.checked)} className="mt-1" />
                    <span className="text-sm text-slate-900">
                      I acknowledge that I have reviewed the <Link href="/docs/Indiana-Barbershop-Apprenticeship-MOU" className="text-brand-blue-600 underline" target="_blank">Memorandum of Understanding (MOU)</Link> and understand that signing it is required to participate as a partner. *
                    </span>
                  </label>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.consentAcknowledged} onChange={e => updateField('consentAcknowledged', e.target.checked)} className="mt-1" />
                    <span className="text-sm text-slate-900">
                      I consent to be contacted regarding this application and acknowledge that my information will be handled according to the <Link href="/legal/privacy" className="text-brand-blue-600 underline">Privacy Policy</Link>. *
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Applicant Signature *</h2>
              <p className="text-sm text-black mb-4">Sign below to confirm that the information provided is accurate and complete.</p>
              <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  className="w-full h-32 cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                {hasSigned ? (
                  <p className="text-sm text-brand-green-600 font-medium">Signature captured</p>
                ) : (
                  <p className="text-sm text-black">Draw your signature above</p>
                )}
                <button type="button" onClick={clearSignature} className="text-sm text-black hover:text-slate-900 underline">
                  Clear
                </button>
              </div>
              <p className="text-xs text-black mt-2">
                By signing, you agree that this electronic signature is legally binding under the Indiana Uniform Electronic Transactions Act (IC 26-2-8) and the federal ESIGN Act.
              </p>
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
      </section>
    </div>
  );
}
