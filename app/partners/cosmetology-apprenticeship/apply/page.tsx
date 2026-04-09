'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const WORKERS_COMP_OPTIONS = [
  { value: 'verified',  label: "Yes — we carry Workers' Compensation insurance" },
  { value: 'exempt',    label: 'Exempt — we have a valid state exemption (will provide documentation)' },
  { value: 'none',      label: "No — we do not currently carry Workers' Compensation" },
];

const COMPENSATION_MODELS = [
  { value: 'hourly',  label: 'Hourly Wage' },
  { value: 'hybrid',  label: 'Hybrid (Hourly Base + Commission)' },
];

const INITIAL_FORM = {
  salonLegalName: '',
  salonDbaName: '',
  ownerName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  salonAddressLine1: '',
  salonAddressLine2: '',
  salonCity: '',
  salonState: 'IN',
  salonZip: '',
  indianaSalonLicenseNumber: '',
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
};

export default function CosmetologySalonApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const set = (field: string, value: string | boolean) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mouAcknowledged || !formData.consentAcknowledged) {
      setError('You must acknowledge the MOU and consent to proceed.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/partners/cosmetology-apprenticeship/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, programType: 'cosmetology' }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Submission failed');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3">Application Submitted</h1>
          <p className="text-slate-600 mb-6">
            Your salon application has been received. Our team will review it within 2–3 business days and contact you at <strong>{formData.contactEmail}</strong>.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-purple-900 font-bold text-sm mb-2">Next steps:</p>
            <ol className="space-y-1 text-purple-800 text-sm list-decimal list-inside">
              <li>Create your program holder account</li>
              <li>Upload your salon license and supervisor license</li>
              <li>Sign the MOU digitally</li>
              <li>Receive apprentice placement</li>
            </ol>
          </div>
          <Link href="/program-holder/apply" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition">
            Create Program Holder Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';
  const sectionCls = 'bg-white rounded-xl border border-slate-200 p-6 space-y-4';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Partners', href: '/partners' },
          { label: 'Cosmetology Apprenticeship', href: '/partners/cosmetology-apprenticeship' },
          { label: 'Apply as Host Salon' },
        ]} />
      </div>

      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <InstitutionalHeader
            documentType="Host Salon Application"
            title="Cosmetology Apprenticeship — Salon Partner Application"
            subtitle="Apply to host cosmetology apprentices at your licensed Indiana salon."
            noDivider
          />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Salon Information */}
          <div className={sectionCls}>
            <h2 className="text-lg font-bold text-slate-900">Salon Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Salon Legal Name *</label>
                <input required className={inputCls} value={formData.salonLegalName} onChange={e => set('salonLegalName', e.target.value)} placeholder="Legal business name" />
              </div>
              <div>
                <label className={labelCls}>DBA / Trade Name</label>
                <input className={inputCls} value={formData.salonDbaName} onChange={e => set('salonDbaName', e.target.value)} placeholder="If different from legal name" />
              </div>
              <div>
                <label className={labelCls}>Owner Name *</label>
                <input required className={inputCls} value={formData.ownerName} onChange={e => set('ownerName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Indiana Salon License Number *</label>
                <input required className={inputCls} value={formData.indianaSalonLicenseNumber} onChange={e => set('indianaSalonLicenseNumber', e.target.value)} placeholder="IPLA license number" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Street Address *</label>
              <input required className={inputCls} value={formData.salonAddressLine1} onChange={e => set('salonAddressLine1', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Suite / Unit</label>
              <input className={inputCls} value={formData.salonAddressLine2} onChange={e => set('salonAddressLine2', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>City *</label>
                <input required className={inputCls} value={formData.salonCity} onChange={e => set('salonCity', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>ZIP *</label>
                <input required className={inputCls} value={formData.salonZip} onChange={e => set('salonZip', e.target.value)} maxLength={10} />
              </div>
            </div>
          </div>

          {/* Primary Contact */}
          <div className={sectionCls}>
            <h2 className="text-lg font-bold text-slate-900">Primary Contact</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Contact Name *</label>
                <input required className={inputCls} value={formData.contactName} onChange={e => set('contactName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Contact Email *</label>
                <input required type="email" className={inputCls} value={formData.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Contact Phone *</label>
                <input required type="tel" className={inputCls} value={formData.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Supervising Cosmetologist */}
          <div className={sectionCls}>
            <h2 className="text-lg font-bold text-slate-900">Supervising Cosmetologist</h2>
            <p className="text-slate-500 text-sm">The designated supervisor must hold a current Indiana cosmetology license and will be responsible for verifying apprentice hours and competencies.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Supervisor Full Name *</label>
                <input required className={inputCls} value={formData.supervisorName} onChange={e => set('supervisorName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Indiana Cosmetology License # *</label>
                <input required className={inputCls} value={formData.supervisorLicenseNumber} onChange={e => set('supervisorLicenseNumber', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Years Licensed *</label>
                <input required type="number" min="1" className={inputCls} value={formData.supervisorYearsLicensed} onChange={e => set('supervisorYearsLicensed', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Employment & Compliance */}
          <div className={sectionCls}>
            <h2 className="text-lg font-bold text-slate-900">Employment &amp; Compliance</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Compensation Model *</label>
                <select required className={inputCls} value={formData.compensationModel} onChange={e => set('compensationModel', e.target.value)}>
                  <option value="">Select...</option>
                  {COMPENSATION_MODELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Number of Current Employees</label>
                <input type="number" min="1" className={inputCls} value={formData.numberOfEmployees} onChange={e => set('numberOfEmployees', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Workers&apos; Compensation Insurance *</label>
                <select required className={inputCls} value={formData.workersCompStatus} onChange={e => set('workersCompStatus', e.target.value)}>
                  <option value="">Select...</option>
                  {WORKERS_COMP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {formData.workersCompStatus === 'none' && (
                  <p className="text-amber-600 text-xs mt-1">⚠️ Workers&apos; compensation coverage is required before apprentice placement can begin.</p>
                )}
              </div>
              <div>
                <label className={labelCls}>General Liability Insurance *</label>
                <select required className={inputCls} value={formData.hasGeneralLiability} onChange={e => set('hasGeneralLiability', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="yes">Yes — we carry general liability insurance</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Can you supervise and verify apprentice hours weekly? *</label>
                <select required className={inputCls} value={formData.canSuperviseAndVerify} onChange={e => set('canSuperviseAndVerify', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className={sectionCls}>
            <h2 className="text-lg font-bold text-slate-900">Additional Information</h2>
            <div>
              <label className={labelCls}>Notes (optional)</label>
              <textarea rows={3} className={inputCls} value={formData.notes} onChange={e => set('notes', e.target.value)} placeholder="Anything else we should know about your salon or training capacity..." />
            </div>
          </div>

          {/* Acknowledgments */}
          <div className={sectionCls}>
            <h2 className="text-lg font-bold text-slate-900">Acknowledgments</h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 accent-purple-600" checked={formData.mouAcknowledged} onChange={e => set('mouAcknowledged', e.target.checked)} />
              <span className="text-sm text-slate-700">
                I have read and agree to the{' '}
                <Link href="/program-holder/sign-mou" target="_blank" className="text-purple-600 hover:underline font-medium">Memorandum of Understanding</Link>{' '}
                for the Cosmetology Apprenticeship Program and understand my responsibilities as a host salon.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 accent-purple-600" checked={formData.consentAcknowledged} onChange={e => set('consentAcknowledged', e.target.checked)} />
              <span className="text-sm text-slate-700">
                I certify that all information provided is accurate and complete. I understand that false or misleading information may result in disqualification from the program.
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
            disabled={loading || !formData.mouAcknowledged || !formData.consentAcknowledged}
            className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : 'Submit Salon Application'}
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
