'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, CreditCard, Building2, FileText,
  Upload, CheckCircle2, AlertCircle, ChevronRight,
  Banknote, Shield,
} from 'lucide-react';

interface Props {
  user: any;
  profile: any;
  rateConfigs: any[];
  existingProfile: any;
}

type PayMethod = 'direct_deposit' | 'pay_card' | 'check';

const PAY_METHODS: { id: PayMethod; label: string; desc: string; icon: any; note?: string }[] = [
  {
    id: 'direct_deposit',
    label: 'Direct Deposit',
    desc: 'Funds deposited directly to your bank account each pay period.',
    icon: Building2,
    note: '1–2 business days',
  },
  {
    id: 'pay_card',
    label: 'Elevate Pay Card',
    desc: 'Visa debit card loaded on pay day. No bank account required.',
    icon: CreditCard,
    note: 'Available same day',
  },
  {
    id: 'check',
    label: 'Paper Check',
    desc: 'Mailed or available for pickup at the office on pay day.',
    icon: Banknote,
    note: 'Pickup or mail',
  },
];

export default function PayrollSetupForm({ user, profile, rateConfigs, existingProfile }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'method' | 'banking' | 'w9' | 'review' | 'done'>(
    existingProfile ? 'review' : 'method'
  );
  const [payMethod, setPayMethod] = useState<PayMethod>(
    existingProfile?.payout_method?.toLowerCase() ?? 'direct_deposit'
  );
  const [banking, setBanking] = useState({
    bankName: existingProfile?.bank_name ?? '',
    accountType: existingProfile?.account_type ?? 'checking',
    routingNumber: '',
    accountNumber: '',
  });
  const [w9File, setW9File] = useState<File | null>(null);
  const [w9Uploaded, setW9Uploaded] = useState(existingProfile?.status === 'active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      if (w9File) {
        fd.append('file', w9File);
        fd.append('documentType', 'w9');
        const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: fd });
        if (!uploadRes.ok) throw new Error('W-9 upload failed');
      }

      const res = await fetch('/api/onboarding/payroll-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: profile.role,
          paymentType: 'HOURLY',
          rate: 0,
          payoutMethod: payMethod.toUpperCase(),
          taxIdUploaded: w9Uploaded || !!w9File,
          bankName: banking.bankName,
          accountType: banking.accountType,
          routingNumber: banking.routingNumber,
          accountNumber: banking.accountNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Setup failed');
      setStep('done');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center">
          <CheckCircle2 className="w-16 h-16 text-brand-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Payroll Setup Complete</h2>
          <p className="text-slate-600 mb-6">Your payment method and W-9 have been submitted. HR will confirm within 1 business day.</p>
          <button onClick={() => router.push('/onboarding/staff')}
            className="w-full bg-brand-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-blue-700">
            Continue Onboarding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-brand-blue-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-brand-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Payroll Setup</h1>
            <p className="text-sm text-slate-500">Hi {profile.full_name ?? user.email} — choose how you'd like to be paid</p>
          </div>
        </div>
        {/* Progress */}
        <div className="max-w-2xl mx-auto px-4 pb-4">
          <div className="flex gap-1">
            {(['method', 'banking', 'w9', 'review'] as const).map((s, i) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${
                ['method', 'banking', 'w9', 'review'].indexOf(step) >= i
                  ? 'bg-brand-blue-600' : 'bg-slate-200'
              }`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── Step 1: Pay Method ── */}
        {step === 'method' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Choose your pay method</h2>
            <p className="text-slate-500 text-sm mb-6">You can change this later by contacting HR.</p>
            <div className="space-y-3">
              {PAY_METHODS.map(({ id, label, desc, icon: Icon, note }) => (
                <button key={id} type="button" onClick={() => setPayMethod(id)}
                  className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                    payMethod === id
                      ? 'border-brand-blue-600 bg-brand-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    payMethod === id ? 'bg-brand-blue-600' : 'bg-slate-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${payMethod === id ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{label}</span>
                      {note && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{note}</span>}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  {payMethod === id && <CheckCircle2 className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
            {payMethod === 'pay_card' && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Elevate Pay Card:</strong> A Visa debit card will be mailed to your address on file within 5–7 business days of your first payroll run. Funds are loaded automatically each pay period.
              </div>
            )}
            <button onClick={() => setStep(payMethod === 'direct_deposit' ? 'banking' : 'w9')}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-blue-700">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 2: Banking (direct deposit only) ── */}
        {step === 'banking' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Bank account details</h2>
            <p className="text-slate-500 text-sm mb-6">Your information is encrypted and used only for payroll deposits.</p>
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                <input value={banking.bankName} onChange={e => setBanking(b => ({ ...b, bankName: e.target.value }))}
                  placeholder="e.g. Chase, Wells Fargo"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                <div className="flex gap-3">
                  {['checking', 'savings'].map(t => (
                    <button key={t} type="button" onClick={() => setBanking(b => ({ ...b, accountType: t }))}
                      className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium capitalize transition ${
                        banking.accountType === t ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-700' : 'border-slate-200 text-slate-600'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Routing Number</label>
                <input value={banking.routingNumber} onChange={e => setBanking(b => ({ ...b, routingNumber: e.target.value }))}
                  placeholder="9-digit routing number" maxLength={9}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                <input value={banking.accountNumber} onChange={e => setBanking(b => ({ ...b, accountNumber: e.target.value }))}
                  placeholder="Account number"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none font-mono" />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                <Shield className="w-4 h-4" />
                Encrypted with AES-256. Never shared with third parties.
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('method')} className="flex-1 py-3 border rounded-xl text-slate-700 font-medium hover:bg-slate-50">Back</button>
              <button onClick={() => setStep('w9')}
                disabled={!banking.bankName || !banking.routingNumber || !banking.accountNumber}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-blue-700 disabled:opacity-50">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: W-9 ── */}
        {step === 'w9' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">W-9 Tax Form</h2>
            <p className="text-slate-500 text-sm mb-6">Required by the IRS for all employees. Download, complete, and upload below.</p>
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-brand-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-brand-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">IRS Form W-9</p>
                  <p className="text-sm text-slate-500 mt-0.5">Request for Taxpayer Identification Number</p>
                  <a href="https://www.irs.gov/pub/irs-pdf/fw9.pdf" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-sm text-brand-blue-600 hover:underline font-medium">
                    <Upload className="w-3.5 h-3.5" /> Download blank W-9 (IRS.gov)
                  </a>
                </div>
              </div>

              {w9Uploaded ? (
                <div className="flex items-center gap-3 bg-brand-green-50 border border-brand-green-200 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-green-600" />
                  <span className="text-sm font-medium text-brand-green-800">W-9 uploaded successfully</span>
                  <button onClick={() => { setW9Uploaded(false); setW9File(null); }}
                    className="ml-auto text-xs text-slate-400 hover:text-slate-600">Remove</button>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-brand-blue-400 hover:bg-brand-blue-50 transition">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">Click to upload your completed W-9</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG, or PNG · Max 10MB</p>
                    {w9File && <p className="text-xs text-brand-green-600 mt-2 font-medium">{w9File.name}</p>}
                  </div>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) { setW9File(f); setW9Uploaded(true); } }} />
                </label>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(payMethod === 'direct_deposit' ? 'banking' : 'method')}
                className="flex-1 py-3 border rounded-xl text-slate-700 font-medium hover:bg-slate-50">Back</button>
              <button onClick={() => setStep('review')} disabled={!w9Uploaded}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-blue-700 disabled:opacity-50">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Review & Submit ── */}
        {step === 'review' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Review & Submit</h2>
            <p className="text-slate-500 text-sm mb-6">Confirm your payroll setup before submitting.</p>
            <div className="bg-white rounded-xl border divide-y">
              <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">Pay Method</span>
                <span className="text-sm font-semibold text-slate-900 capitalize">{payMethod.replace('_', ' ')}</span>
              </div>
              {payMethod === 'direct_deposit' && (
                <>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Bank</span>
                    <span className="text-sm font-semibold text-slate-900">{banking.bankName || '—'}</span>
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Account</span>
                    <span className="text-sm font-semibold text-slate-900 capitalize">{banking.accountType} ···{banking.accountNumber.slice(-4)}</span>
                  </div>
                </>
              )}
              <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">W-9</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-green-700">
                  <CheckCircle2 className="w-4 h-4" /> Uploaded
                </span>
              </div>
            </div>
            {error && (
              <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('w9')} className="flex-1 py-3 border rounded-xl text-slate-700 font-medium hover:bg-slate-50">Back</button>
              <button onClick={submit} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-green-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-green-700 disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit Payroll Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
