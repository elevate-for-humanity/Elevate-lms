'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, Download } from 'lucide-react';

const employmentModels = [
  { value: 'hourly', label: 'Hourly Wage' },
  { value: 'commission', label: 'Commission' },
  { value: 'hybrid', label: 'Hybrid (Wage + Commission)' },
  { value: 'not_sure', label: 'Not Sure Yet' },
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
    employmentModel: '',
    hasWorkersComp: '',
    canSuperviseAndVerify: '',
    mouAcknowledged: false,
    consentAcknowledged: false,
    notes: '',
    honeypot: '',
  });

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

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/partners/barbershop-apprenticeship/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Apply" }]} />
      </div>
<section className="bg-slate-800 text-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/partners/barbershop-apprenticeship" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Partner Information
          </Link>
          <h1 className="text-3xl font-bold mb-3">Barbershop Partner Application</h1>
          <p className="text-slate-300">Complete this form to apply as a worksite partner for the Indiana Barber Apprenticeship program.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4">
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
                    <input type="text" value="Indiana" disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600" />
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Intended Compensation Model *</label>
                  <div className="grid md:grid-cols-2 gap-2">
                    {employmentModels.map(model => (
                      <label key={model.value} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="employmentModel" value={model.value} checked={formData.employmentModel === model.value} onChange={e => updateField('employmentModel', e.target.value)} required className="text-brand-blue-600" />
                        <span className="text-gray-700">{model.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Do you carry workers&apos; compensation insurance? *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="hasWorkersComp" value="yes" checked={formData.hasWorkersComp === 'yes'} onChange={e => updateField('hasWorkersComp', e.target.value)} required />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="hasWorkersComp" value="no" checked={formData.hasWorkersComp === 'no'} onChange={e => updateField('hasWorkersComp', e.target.value)} />
                      <span>No</span>
                    </label>
                  </div>
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
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.consentAcknowledged} onChange={e => updateField('consentAcknowledged', e.target.checked)} className="mt-1" />
                    <span className="text-sm text-gray-700">
                      I consent to be contacted regarding this application and acknowledge that my information will be handled according to the <Link href="/privacy-policy" className="text-brand-blue-600 underline">Privacy Policy</Link>. *
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Honeypot */}
            <input type="text" name="website" value={formData.honeypot} onChange={e => updateField('honeypot', e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button type="submit" disabled={loading} className="flex-1 inline-flex items-center justify-center px-8 py-4 bg-brand-blue-600 text-white rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-50 transition-colors">
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</> : 'Submit Application'}
              </button>
              <Link href="/docs/Indiana-Barbershop-Apprenticeship-MOU" className="inline-flex items-center justify-center px-6 py-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50" target="_blank">
                <Download className="w-5 h-5 mr-2" /> View MOU
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
