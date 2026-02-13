'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DollarSign, CheckCircle, Upload, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';

interface Props {
  userId?: string;
  existingProfile: any;
}

export default function SupersonicForm({ userId, existingProfile }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: existingProfile?.first_name || '',
    lastName: existingProfile?.last_name || '',
    email: existingProfile?.email || '',
    phone: existingProfile?.phone || '',
    ssn: '',
    income: '',
    filingStatus: '',
    dependents: '0',
    hasW2: false,
    has1099: false,
    bankAccount: '',
    routingNumber: '',
    accountType: 'checking',
  });

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Estimate refund based on income and filing status
  const estimateRefund = () => {
    const income = parseFloat(formData.income) || 0;
    const dependents = parseInt(formData.dependents) || 0;
    
    // Simplified estimation
    let estimate = 0;
    if (income < 30000) estimate = 1500;
    else if (income < 50000) estimate = 2500;
    else if (income < 75000) estimate = 3500;
    else estimate = 4500;
    
    // Add for dependents
    estimate += dependents * 500;
    
    // Cap at reasonable amount
    return Math.min(estimate, 7000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: submitError } = await supabase
        .from('refund_advance_applications')
        .insert({
          user_id: userId || null,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          ssn_last_four: formData.ssn.slice(-4),
          estimated_income: parseFloat(formData.income) || 0,
          filing_status: formData.filingStatus,
          dependents: parseInt(formData.dependents) || 0,
          has_w2: formData.hasW2,
          has_1099: formData.has1099,
          bank_account_last_four: formData.bankAccount.slice(-4),
          account_type: formData.accountType,
          estimated_amount: estimateRefund(),
          status: 'pending',
        });

      if (submitError) throw submitError;

      router.push('/supersonic/success');
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= s ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-orange-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Personal & Income Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input type="text" value={formData.firstName} 
                  onChange={e => updateField('firstName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input type="text" value={formData.lastName}
                  onChange={e => updateField('lastName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={formData.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={formData.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            
            <hr />
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Annual Income *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="number" value={formData.income}
                    onChange={e => updateField('income', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="50000" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status *</label>
                <select value={formData.filingStatus}
                  onChange={e => updateField('filingStatus', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select status...</option>
                  <option value="single">Single</option>
                  <option value="married-joint">Married Filing Jointly</option>
                  <option value="married-separate">Married Filing Separately</option>
                  <option value="head">Head of Household</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Dependents</label>
                <input type="number" value={formData.dependents}
                  onChange={e => updateField('dependents', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="0" min="0" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Income Documents</p>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.hasW2}
                    onChange={e => updateField('hasW2', e.target.checked)} />
                  <span>I have W-2 forms</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.has1099}
                    onChange={e => updateField('has1099', e.target.checked)} />
                  <span>I have 1099 forms</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Upload Documents</h2>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="font-medium mb-2">Drag and drop your tax documents</p>
              <p className="text-sm text-gray-500 mb-4">W-2s, 1099s, and other income documents</p>
              <button type="button" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                Browse Files
              </button>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Secure Upload</p>
                <p className="text-blue-700">Your documents are encrypted and securely stored.</p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Bank Information</h2>
            <p className="text-gray-600">Enter your bank details for direct deposit of your refund advance.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number *</label>
                <input type="text" value={formData.bankAccount}
                  onChange={e => updateField('bankAccount', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="Enter account number" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number *</label>
                <input type="text" value={formData.routingNumber}
                  onChange={e => updateField('routingNumber', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="Enter routing number" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select value={formData.accountType}
                  onChange={e => updateField('accountType', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="font-medium text-green-900 mb-2">Estimated Refund Advance</p>
              <p className="text-3xl font-bold text-green-600">${estimateRefund().toLocaleString()}</p>
              <p className="text-sm text-green-700 mt-1">Available within 24 hours of approval</p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && (!formData.firstName || !formData.lastName || !formData.email || !formData.income || !formData.filingStatus)}
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isSubmitting || !formData.bankAccount || !formData.routingNumber}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
