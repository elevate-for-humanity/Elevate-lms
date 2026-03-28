'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Loader2, AlertCircle, Download,
  BookOpen, FileText, ClipboardCheck, ShieldCheck, ArrowRight,
} from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';

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

export default function BarbershopPartnerApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

    setLoading(true);
    setError('');

    try {
      const signatureData = canvasRef.current?.toDataURL('image/png') || '';
      const response = await fetch('/api/partners/barbershop-apprenticeship/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, signatureData }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      if (!result.applicationId) {
        setError('Application could not be confirmed. Please call (317) 314-3757.');
        setLoading(false);
        return;
      }

      router.push('/partners/barbershop-apprenticeship/thank-you');
    } catch {
      setError('Unable to submit. Please try again or call (317) 314-3757.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Barbershop', href: '/partners/barbershop-apprenticeship' }, { label: 'Apply' }]} />
      </div>

      {/* Hero */}
      <section className="py-6 border-b">
        <div className="max-w-5xl mx-auto px-4">
          <Link href="/partners/barbershop-apprenticeship" className="inline-flex items-center gap-1 text-gray-600 hover:text-brand-blue-700 text-sm mb-4">
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
          {/* Before You Apply checklist */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Before You Apply</h2>
            <p className="text-sm text-gray-500 mb-5">Complete these steps first so you&apos;re ready to submit.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {partnerSteps.map((step) => (
                <Link
                  key={step.href}
                  href={step.href}
                  className="group flex flex-col gap-3 p-4 rounded-lg border border-gray-200 hover:border-brand-blue-300 hover:bg-brand-blue-50/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center group-hover:bg-brand-blue-100 transition-colors">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-brand-blue-700 transition-colors flex items-center gap-1">
                      {step.label}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
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
              <h2 className="text-xl font-bold text-gray-900 mb-6">Shop Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Legal Name *</label>
                  <input type="text" required value={formData.shopLegalName} onChange={e => updateField('shopLegalName', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DBA Name (if different)</label>
                  <input type="text" value={formData.shopDbaName} onChange={e => updateField('shopDbaName', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                  <input type="text" required value={formData.ownerName} onChange={e => updateField('ownerName', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Indiana Shop License # *</label>
                  <input type="text" required value={formData.indianaShopLicenseNumber} onChange={e => updateField('indianaShopLicenseNumber', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Name *</label>
                  <input type="text" required value={formData.contactName} onChange={e => updateField('contactName', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" required value={formData.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" required value={formData.contactPhone} onChange={e => updateField('contactPhone', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Shop Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                  <input type="text" required value={formData.shopAddressLine1} onChange={e => updateField('shopAddressLine1', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input type="text" value={formData.shopAddressLine2} onChange={e => updateField('shopAddressLine2', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input type="text" required value={formData.shopCity} onChange={e => updateField('shopCity', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input type="text" value="Indiana" disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP *</label>
                    <input type="text" required value={formData.shopZip} onChange={e => updateField('shopZip', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Supervising Barber */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Supervising Barber</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Name *</label>
                  <input type="text" required value={formData.supervisorName} onChange={e => updateField('supervisorName', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor License # *</label>
                  <input type="text" required value={formData.supervisorLicenseNumber} onChange={e => updateField('supervisorLicenseNumber', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years Licensed</label>
                  <input type="number" min="0" value={formData.supervisorYearsLicensed} onChange={e => updateField('supervisorYearsLicensed', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
                </div>
              </div>
            </div>

            {/* Employment & Compliance */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Employment & Compliance</h2>
              <p className="text-sm text-gray-500 mb-6">
                As a DOL Registered Apprenticeship, apprentices must be employed by the host shop.
                Elevate (as the registered sponsor) will register approved apprentices and employer
                worksites in the federal RAPIDS system after compliance verification.
              </p>
              <div className="space-y-6">
                {/* Payroll confirmation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Will apprentices be added to your payroll as employees? *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    DOL Registered Apprenticeships require the apprentice to be an employee of the host shop,
                    regardless of compensation model (hourly or hybrid). Sole commission is not permitted.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-white">
                      <input type="radio" name="apprenticesOnPayroll" value="yes" checked={formData.apprenticesOnPayroll === 'yes'} onChange={e => updateField('apprenticesOnPayroll', e.target.value)} required className="text-brand-blue-600" />
                      <span className="text-gray-700">Yes — apprentices will be on our payroll</span>
                    </label>
                  </div>
                  <p className="text-xs text-amber-700 mt-2">
                    Shops that cannot add apprentices to payroll are not eligible to host registered apprenticeship OJL.
                  </p>
                </div>

                {/* Compensation model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compensation Model *</label>
                  <div className="grid md:grid-cols-3 gap-2">
                    {compensationModels.map(model => (
                      <label key={model.value} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-white">
                        <input type="radio" name="compensationModel" value={model.value} checked={formData.compensationModel === model.value} onChange={e => updateField('compensationModel', e.target.value)} required className="text-brand-blue-600" />
                        <span className="text-gray-700">{model.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Number of employees */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Number of Employees (including owner) *</label>
                  <input type="number" min="1" value={formData.numberOfEmployees} onChange={e => updateField('numberOfEmployees', e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="e.g. 3" />
                </div>

                {/* General Liability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Do you carry General Liability insurance? *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Workers&apos; Compensation Status *</label>
                  <div className="space-y-2">
                    {workersCompOptions.map(opt => (
                      <label key={opt.value} className="flex items-start gap-2 p-3 border rounded-lg cursor-pointer hover:bg-white">
                        <input type="radio" name="workersCompStatus" value={opt.value} checked={formData.workersCompStatus === opt.value} onChange={e => updateField('workersCompStatus', e.target.value)} required className="mt-0.5 text-brand-blue-600" />
                        <span className="text-gray-700 text-sm">{opt.label}</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Can you commit to supervising apprentices and verifying hours/competencies? *</label>
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
              <h2 className="text-xl font-bold text-gray-900 mb-6">Additional Information</h2>
              <textarea rows={4} value={formData.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Any additional information you'd like to share..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
            </div>

            {/* Acknowledgments */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Acknowledgments</h2>
              <div className="space-y-4">
                <div className="p-4 bg-brand-blue-50 border border-brand-blue-200 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.mouAcknowledged} onChange={e => updateField('mouAcknowledged', e.target.checked)} className="mt-1" />
                    <span className="text-sm text-gray-700">
                      I acknowledge that I have reviewed the <Link href="/docs/Indiana-Barbershop-Apprenticeship-MOU" className="text-brand-blue-600 underline" target="_blank">Memorandum of Understanding (MOU)</Link> and understand that signing it is required to participate as a partner. *
                    </span>
                  </label>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.consentAcknowledged} onChange={e => updateField('consentAcknowledged', e.target.checked)} className="mt-1" />
                    <span className="text-sm text-gray-700">
                      I consent to be contacted regarding this application and acknowledge that my information will be handled according to the <Link href="/privacy-policy" className="text-brand-blue-600 underline">Privacy Policy</Link>. *
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Applicant Signature *</h2>
              <p className="text-sm text-gray-500 mb-4">Sign below to confirm that the information provided is accurate and complete.</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
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
                  <p className="text-sm text-green-600 font-medium">Signature captured</p>
                ) : (
                  <p className="text-sm text-slate-500">Draw your signature above</p>
                )}
                <button type="button" onClick={clearSignature} className="text-sm text-gray-500 hover:text-gray-700 underline">
                  Clear
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
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
              <Link href="/docs/Indiana-Barbershop-Apprenticeship-MOU" className="inline-flex items-center justify-center px-6 py-4 border border-gray-300 rounded-lg font-medium hover:bg-white" target="_blank">
                <Download className="w-5 h-5 mr-2" /> View MOU
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
