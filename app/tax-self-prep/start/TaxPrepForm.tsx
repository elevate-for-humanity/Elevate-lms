'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FileText, User, Briefcase, Home, Heart, DollarSign, ArrowRight, Save } from 'lucide-react';

interface Props {
  userId: string;
  profile: any;
  existingDraft: any;
  taxYear: number;
}

const sections = [
  { id: 'personal', name: 'Personal Info', icon: User },
  { id: 'income', name: 'Income', icon: Briefcase },
  { id: 'deductions', name: 'Deductions', icon: Home },
  { id: 'credits', name: 'Credits', icon: Heart },
  { id: 'review', name: 'Review & File', icon: FileText },
];

export default function TaxPrepForm({ userId, profile, existingDraft, taxYear }: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('personal');
  const [completedSections, setCompletedSections] = useState<string[]>(
    existingDraft?.completed_sections || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    firstName: existingDraft?.data?.firstName || profile?.first_name || '',
    lastName: existingDraft?.data?.lastName || profile?.last_name || '',
    ssn: existingDraft?.data?.ssn || '',
    dateOfBirth: existingDraft?.data?.dateOfBirth || '',
    filingStatus: existingDraft?.data?.filingStatus || 'single',
    w2Wages: existingDraft?.data?.w2Wages || '',
    w2Employer: existingDraft?.data?.w2Employer || '',
    w2Withholding: existingDraft?.data?.w2Withholding || '',
    income1099: existingDraft?.data?.income1099 || '',
    otherIncome: existingDraft?.data?.otherIncome || '',
    deductionType: existingDraft?.data?.deductionType || 'standard',
    mortgageInterest: existingDraft?.data?.mortgageInterest || '',
    charitableDonations: existingDraft?.data?.charitableDonations || '',
    eitc: existingDraft?.data?.eitc || false,
    childTaxCredit: existingDraft?.data?.childTaxCredit || false,
    educationCredits: existingDraft?.data?.educationCredits || false,
    retirementCredit: existingDraft?.data?.retirementCredit || false,
  });

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate estimated refund
  const calculateRefund = () => {
    const wages = parseFloat(formData.w2Wages) || 0;
    const withholding = parseFloat(formData.w2Withholding) || 0;
    const income1099 = parseFloat(formData.income1099) || 0;
    const totalIncome = wages + income1099;
    
    // Simplified tax calculation
    let tax = 0;
    if (totalIncome <= 10000) tax = totalIncome * 0.10;
    else if (totalIncome <= 40000) tax = 1000 + (totalIncome - 10000) * 0.12;
    else if (totalIncome <= 85000) tax = 4600 + (totalIncome - 40000) * 0.22;
    else tax = 14500 + (totalIncome - 85000) * 0.24;

    // Standard deduction
    if (formData.deductionType === 'standard') {
      tax = Math.max(0, tax - 13850 * 0.12);
    }

    // Credits
    if (formData.eitc && totalIncome < 50000) tax = Math.max(0, tax - 1500);
    if (formData.childTaxCredit) tax = Math.max(0, tax - 2000);
    if (formData.educationCredits) tax = Math.max(0, tax - 1000);

    return Math.round(withholding - tax);
  };

  const saveDraft = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();

      // Strip full SSN before persisting — store only last 4 digits
      const safeData = { ...formData };
      if (typeof safeData.ssn === 'string' && safeData.ssn.replace(/\D/g, '').length === 9) {
        const digits = safeData.ssn.replace(/\D/g, '');
        (safeData as any).ssn_last4 = digits.slice(-4);
        safeData.ssn = '';
      }
      
      const draftData = {
        user_id: userId,
        tax_year: taxYear,
        data: safeData,
        completed_sections: completedSections,
        status: 'draft',
        updated_at: new Date().toISOString(),
      };

      if (existingDraft) {
        await supabase
          .from('tax_return_drafts')
          .update(draftData)
          .eq('id', existingDraft.id);
      } else {
        await supabase
          .from('tax_return_drafts')
          .insert(draftData);
      }

      setMessage({ type: 'success', text: 'Progress saved' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save' });
    } finally {
      setIsSaving(false);
    }
  };

  const markComplete = (sectionId: string) => {
    if (!completedSections.includes(sectionId)) {
      setCompletedSections([...completedSections, sectionId]);
    }
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
    }
    saveDraft();
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      
      // Create tax filing record
      await supabase
        .from('tax_filings')
        .insert({
          user_id: userId,
          tax_year: taxYear,
          filing_status: formData.filingStatus,
          total_income: (parseFloat(formData.w2Wages) || 0) + (parseFloat(formData.income1099) || 0),
          total_withholding: parseFloat(formData.w2Withholding) || 0,
          estimated_refund: calculateRefund(),
          status: 'submitted',
        });

      // Update draft status
      if (existingDraft) {
        await supabase
          .from('tax_return_drafts')
          .update({ status: 'submitted' })
          .eq('id', existingDraft.id);
      }

      router.push('/tax-self-prep/success');
    } catch (err: any) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const estimatedRefund = calculateRefund();

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="md:col-span-1">
        <nav className="bg-white rounded-xl border p-2 sticky top-4">
          {sections.map((section, idx) => (
            <button key={section.id} onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left ${
                activeSection === section.id ? 'bg-brand-orange-50 text-brand-orange-600' : 'hover:bg-white'
              }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                completedSections.includes(section.id) ? 'bg-brand-green-500 text-white' :
                activeSection === section.id ? 'bg-brand-orange-500 text-white' : 'bg-gray-200'
              }`}>
                {completedSections.includes(section.id) 
                  ? <span className="text-slate-400 flex-shrink-0">•</span> 
                  : <section.icon className="w-4 h-4" />}
              </div>
              <span className="text-sm font-medium">{section.name}</span>
            </button>
          ))}
        </nav>
        
        <button onClick={saveDraft} disabled={isSaving}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-white">
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Progress'}
        </button>
      </div>

      {/* Main Content */}
      <div className="md:col-span-3">
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-brand-green-50 text-brand-green-700' : 'bg-brand-red-50 text-brand-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl border p-6">
          {activeSection === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" value={formData.firstName}
                    onChange={e => updateField('firstName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" value={formData.lastName}
                    onChange={e => updateField('lastName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Social Security Number</label>
                  <input type="text" value={formData.ssn}
                    onChange={e => updateField('ssn', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="XXX-XX-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" value={formData.dateOfBirth}
                    onChange={e => updateField('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status</label>
                  <select value={formData.filingStatus}
                    onChange={e => updateField('filingStatus', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg">
                    <option value="single">Single</option>
                    <option value="married-joint">Married Filing Jointly</option>
                    <option value="married-separate">Married Filing Separately</option>
                    <option value="head">Head of Household</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'income' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Income Sources</h2>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-3">W-2 Wages</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Employer Name</label>
                    <input type="text" value={formData.w2Employer}
                      onChange={e => updateField('w2Employer', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Wages (Box 1)</label>
                    <input type="number" value={formData.w2Wages}
                      onChange={e => updateField('w2Wages', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Federal Withholding (Box 2)</label>
                    <input type="number" value={formData.w2Withholding}
                      onChange={e => updateField('w2Withholding', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg" placeholder="0.00" />
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-3">1099 Income</h3>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Total 1099 Income</label>
                  <input type="number" value={formData.income1099}
                    onChange={e => updateField('income1099', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="0.00" />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'deductions' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Deductions</h2>
              <div className="space-y-4">
                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
                  formData.deductionType === 'standard' ? 'border-brand-orange-500 bg-brand-orange-50' : 'hover:bg-white'
                }`}>
                  <input type="radio" name="deduction" value="standard"
                    checked={formData.deductionType === 'standard'}
                    onChange={e => updateField('deductionType', e.target.value)} />
                  <div>
                    <p className="font-medium">Standard Deduction</p>
                    <p className="text-sm text-gray-500">$13,850 for single filers ({taxYear})</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
                  formData.deductionType === 'itemized' ? 'border-brand-orange-500 bg-brand-orange-50' : 'hover:bg-white'
                }`}>
                  <input type="radio" name="deduction" value="itemized"
                    checked={formData.deductionType === 'itemized'}
                    onChange={e => updateField('deductionType', e.target.value)} />
                  <div>
                    <p className="font-medium">Itemized Deductions</p>
                    <p className="text-sm text-gray-500">Mortgage interest, charitable donations, etc.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeSection === 'credits' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Tax Credits</h2>
              <div className="space-y-3">
                {[
                  { key: 'eitc', label: 'Earned Income Tax Credit (EITC)' },
                  { key: 'childTaxCredit', label: 'Child Tax Credit' },
                  { key: 'educationCredits', label: 'Education Credits' },
                  { key: 'retirementCredit', label: 'Retirement Savings Credit' },
                ].map(credit => (
                  <label key={credit.key} className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-white">
                    <input type="checkbox"
                      checked={formData[credit.key as keyof typeof formData] as boolean}
                      onChange={e => updateField(credit.key, e.target.checked)}
                      className="w-5 h-5 rounded" />
                    <span>{credit.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'review' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Review & File</h2>
              <div className={`rounded-lg p-6 text-center ${estimatedRefund >= 0 ? 'bg-brand-green-50' : 'bg-brand-red-50'}`}>
                <DollarSign className={`w-12 h-12 mx-auto mb-2 ${estimatedRefund >= 0 ? 'text-brand-green-500' : 'text-brand-red-500'}`} />
                <p className="text-sm text-gray-600 mb-1">
                  {estimatedRefund >= 0 ? 'Estimated Refund' : 'Estimated Amount Owed'}
                </p>
                <p className={`text-4xl font-bold ${estimatedRefund >= 0 ? 'text-brand-green-700' : 'text-brand-red-700'}`}>
                  ${Math.abs(estimatedRefund).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                {sections.slice(0, -1).map(section => (
                  <div key={section.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span>{section.name}</span>
                    {completedSections.includes(section.id) ? (
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    ) : (
                      <span className="text-sm text-brand-orange-600">Incomplete</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t">
            <button onClick={() => activeSection === 'review' ? handleSubmit() : markComplete(activeSection)}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600 disabled:opacity-50">
              {activeSection === 'review' ? 'File My Return' : 'Save & Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
