'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, ChevronRight, Upload, PenLine } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 'profile',   label: 'Complete Profile' },
  { id: 'mou',       label: 'Sign MOU' },
  { id: 'agreement', label: 'Employer Agreement' },
  { id: 'done',      label: 'Complete' },
];

type Step = typeof STEPS[number]['id'];

// ── Profile form ──────────────────────────────────────────────────────────────
function ProfileStep({ onNext }: { onNext: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    shop_name: '', owner_name: '', contact_name: '', ein: '',
    phone: '', contact_email: '', address_line1: '', city: '', state: 'Indiana', zip: '',
    license_number: '', license_state: 'Indiana', license_expiry: '',
    website: '', apprentice_capacity: '',
  });
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const required = ['shop_name','owner_name','ein','phone','contact_email','address_line1','city','zip','license_number','license_expiry'];
    const missing = required.filter(k => !form[k as keyof typeof form]);
    if (missing.length) { setError('Please complete all required fields: ' + missing.join(', ')); return; }
    setError('');
    onNext(form);
  };

  const field = (label: string, key: keyof typeof form, type = 'text', required = true, placeholder = '') => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>A complete profile is required before apprentices can be placed at your shop. All fields marked * are required by the U.S. Department of Labor.</p>
      </div>

      <h3 className="font-bold text-gray-900">Business Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field('Barbershop Name', 'shop_name', 'text', true, 'e.g. Prestige Cuts Barbershop')}
        {field('Owner Full Name', 'owner_name', 'text', true, 'e.g. Jane Smith')}
        {field('Contact Name (if different)', 'contact_name', 'text', false)}
        {field('Federal EIN', 'ein', 'text', true, 'XX-XXXXXXX')}
        {field('Phone', 'phone', 'tel', true, '(317) 000-0000')}
        {field('Email', 'contact_email', 'email', true)}
        {field('Website', 'website', 'url', false, 'https://')}
        {field('Max Apprentice Capacity', 'apprentice_capacity', 'number', false, '4')}
      </div>

      <h3 className="font-bold text-gray-900 mt-2">Business Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field('Street Address', 'address_line1', 'text', true)}
        {field('City', 'city', 'text', true)}
        {field('State', 'state', 'text', true)}
        {field('ZIP Code', 'zip', 'text', true)}
      </div>

      <h3 className="font-bold text-gray-900 mt-2">Indiana Barber Shop License</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {field('License Number', 'license_number', 'text', true)}
        {field('License State', 'license_state', 'text', true)}
        {field('License Expiry Date', 'license_expiry', 'date', true)}
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
        <Upload className="w-8 h-8 text-black mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-700">Upload License Photos</p>
        <p className="text-xs text-black mt-1">Upload full, clear photos of your Indiana Barber Shop License and all mentor/journeyperson barber licenses. Both front and back required.</p>
        <p className="text-xs text-red-600 mt-2 font-semibold">⚠ Partial or cropped images will not be accepted</p>
        <input type="file" multiple accept="image/*,.pdf" className="mt-3 text-sm text-black" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
        Save Profile & Continue <ChevronRight className="w-5 h-5" />
      </button>
    </form>
  );
}

// ── MOU signing step ──────────────────────────────────────────────────────────
function MOUStep({ profileData, onNext }: { profileData: Record<string, string>; onNext: () => void }) {
  const [sig, setSig] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sig.trim()) { setError('Please type your full legal name as your signature'); return; }
    if (!agreed) { setError('You must agree to the MOU terms'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/partners/barbershop/sign-mou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, signature: sig, agreed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign MOU');
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return (
    <div className="text-center space-y-4">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <h3 className="text-xl font-bold text-gray-900">MOU Signed Successfully</h3>
      <p className="text-black text-sm">Your Memorandum of Understanding has been recorded. Continue to the Employer Agreement.</p>
      <button onClick={onNext} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
        Continue to Employer Agreement <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* MOU Document */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto text-sm text-gray-800 space-y-4">
        <div className="text-center border-b pb-4">
          <p className="text-xs text-black uppercase tracking-wide font-semibold">Version 2.0 — 2025</p>
          <h3 className="text-lg font-bold text-gray-900 mt-1">Employer Training Site MOU</h3>
          <p className="text-xs text-black">Barber Apprenticeship Program · RAPIDS: 2025-IN-132301</p>
          <p className="text-xs text-black mt-1">Sponsor: 2Exclusive LLC-S (DBA: Elevate for Humanity Technical and Career Institute)</p>
        </div>
        <p>This MOU is entered into between <strong>2Exclusive LLC-S (DBA: Elevate for Humanity Technical and Career Institute)</strong> ("Sponsor") and <strong>{profileData.shop_name || 'Employer Training Site'}</strong> ("Employer"), governed by 29 CFR Parts 29 and 30.</p>
        <p><strong>Employer agrees to:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide 2,000 hours/year of structured On-the-Job Learning (OJL) per apprentice</li>
          <li>Assign a licensed Indiana journeyperson barber as mentor (max 1:4 ratio)</li>
          <li>Maintain current Indiana Barber Shop License throughout the term</li>
          <li>Pay apprentices per the progressive wage schedule in the Standards of Apprenticeship</li>
          <li>Track and submit OJL hours monthly using Sponsor-provided forms</li>
          <li>Provide full copies of all barber licenses to the Sponsor upon request</li>
          <li>Comply with 29 CFR Part 30 equal opportunity requirements</li>
          <li>Notify Sponsor within 5 business days of any apprentice status change</li>
          <li>Participate in quarterly program reviews and DOL audits</li>
        </ul>
        <p><strong>Sponsor agrees to:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Recruit, screen, and enroll qualified apprentice candidates</li>
          <li>Provide all Related Technical Instruction (RTI) — min. 144 hours/year</li>
          <li>Register each apprentice in RAPIDS within 30 days of enrollment</li>
          <li>Provide ongoing case management and compliance support</li>
          <li>Issue Certificates of Completion upon program completion</li>
        </ul>
        <p><strong>Term:</strong> 1 year, auto-renewing. Either party may terminate with 30 days written notice. Sponsor may terminate immediately for cause.</p>
        <p><strong>Incomplete profiles will result in suspension of apprentice placements.</strong></p>
      </div>

      {/* Signature */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          <PenLine className="w-4 h-4 inline mr-1" />
          Digital Signature — Type your full legal name *
        </label>
        <input type="text" value={sig} onChange={e => setSig(e.target.value)}
          placeholder={profileData.owner_name || 'Your full legal name'}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-signature focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <p className="text-xs text-black mt-1">By typing your name you are applying a legally binding digital signature</p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <input type="checkbox" id="agreed" checked={agreed} onChange={e => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 text-blue-600 rounded" />
        <label htmlFor="agreed" className="text-sm text-gray-700">
          I have read and agree to the terms of this Memorandum of Understanding. I understand this digital signature is legally binding and has the same effect as a handwritten signature. I confirm I am authorized to sign on behalf of <strong>{profileData.shop_name || 'my business'}</strong>.
        </label>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      <button type="submit" disabled={submitting || !sig || !agreed}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors">
        {submitting ? 'Signing...' : 'Sign MOU'}
      </button>
    </form>
  );
}

// ── Employer Agreement (RAPIDS) ───────────────────────────────────────────────
function EmployerAgreementStep({ profileData, onNext }: { profileData: Record<string, string>; onNext: () => void }) {
  const [form, setForm] = useState({
    mentor_name: '', mentor_license: '', mentor_license_expiry: '',
    wage_year1: '', wage_year2: '', wage_year3: '',
    ojl_hours_year: '2000', rti_hours_year: '144',
    workers_comp: '', liability_insurance: '',
    signature: '', title: '', agreed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.signature.trim()) { setError('Signature required'); return; }
    if (!form.agreed) { setError('You must agree to the employer agreement terms'); return; }
    if (!form.mentor_name || !form.mentor_license) { setError('Mentor name and license number are required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/partners/barbershop/employer-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit agreement');
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return (
    <div className="text-center space-y-4">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <h3 className="text-xl font-bold text-gray-900">Employer Agreement Complete</h3>
      <p className="text-black text-sm">Your employer agreement has been submitted and recorded for RAPIDS. Elevate will review and confirm your onboarding within 2 business days.</p>
      <button onClick={onNext} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors">
        Complete Onboarding
      </button>
    </div>
  );

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label} <span className="text-red-500">*</span></label>
      <input type={type} value={form[key as keyof typeof form] as string}
        onChange={e => set(key, e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Required for RAPIDS Registration</p>
        <p>This Employer Agreement is required by the U.S. Department of Labor for all Registered Apprenticeship training sites. Information provided here will be submitted to RAPIDS (Registered Apprenticeship Partners Information Data System).</p>
      </div>

      <h3 className="font-bold text-gray-900">Primary Mentor / Journeyperson Barber</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {field('Mentor Full Name', 'mentor_name', 'text', 'Licensed journeyperson barber')}
        {field('Indiana Barber License #', 'mentor_license')}
        {field('License Expiry', 'mentor_license_expiry', 'date')}
      </div>

      <h3 className="font-bold text-gray-900">Progressive Wage Schedule</h3>
      <p className="text-xs text-black">Apprentice wages must increase progressively. Enter hourly rates for each year of the apprenticeship.</p>
      <div className="grid grid-cols-3 gap-4">
        {field('Year 1 Hourly Rate ($)', 'wage_year1', 'text', 'e.g. 10.00')}
        {field('Year 2 Hourly Rate ($)', 'wage_year2', 'text', 'e.g. 12.00')}
        {field('Year 3 Hourly Rate ($)', 'wage_year3', 'text', 'e.g. 14.00')}
      </div>

      <h3 className="font-bold text-gray-900">Training Hours</h3>
      <div className="grid grid-cols-2 gap-4">
        {field('OJL Hours Per Year', 'ojl_hours_year', 'number')}
        {field('RTI Hours Per Year', 'rti_hours_year', 'number')}
      </div>

      <h3 className="font-bold text-gray-900">Insurance</h3>
      <div className="grid grid-cols-2 gap-4">
        {field("Workers' Comp Policy #", 'workers_comp')}
        {field('General Liability Policy #', 'liability_insurance')}
      </div>

      <h3 className="font-bold text-gray-900">Employer Certifications</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 space-y-2">
        <p>By signing below, the Employer certifies that:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>All information provided is accurate and complete</li>
          <li>The business holds a current, valid Indiana Barber Shop License</li>
          <li>All mentors hold current Indiana journeyperson barber licenses</li>
          <li>The business maintains workers' compensation and general liability insurance</li>
          <li>The business will comply with all DOL Standards of Apprenticeship (29 CFR Parts 29 & 30)</li>
          <li>The business will pay apprentices no less than the progressive wage schedule above</li>
          <li>The business will submit monthly OJL hour reports to the Sponsor</li>
          <li>The business will allow DOL and Sponsor audits of the training site</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {field('Authorized Signature (type full name)', 'signature', 'text', profileData.owner_name)}
        {field('Title / Position', 'title', 'text', 'Owner')}
      </div>

      <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <input type="checkbox" id="emp_agreed" checked={form.agreed}
          onChange={e => set('agreed', e.target.checked)} className="mt-1 h-4 w-4 text-blue-600 rounded" />
        <label htmlFor="emp_agreed" className="text-sm text-gray-700">
          I certify that all information is accurate and I am authorized to enter into this Employer Agreement on behalf of <strong>{profileData.shop_name || 'my business'}</strong>. I understand this agreement will be submitted to the U.S. Department of Labor RAPIDS system.
        </label>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      <button type="submit" disabled={submitting || !form.signature || !form.agreed}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors">
        {submitting ? 'Submitting...' : 'Submit Employer Agreement'}
      </button>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BarbershopOnboardingPage() {
  // Auth guard — must be signed in to access onboarding
  useEffect(() => {
    const checkAuth = async () => {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login?redirect=/partners/barbershop-apprenticeship/onboarding';
      }
    };
    checkAuth();
  }, []);

  const [step, setStep] = useState<Step>('profile');
  const [profileData, setProfileData] = useState<Record<string, string>>({});

  const stepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <p className="text-xs text-black uppercase tracking-wide font-semibold mb-1">Barber Apprenticeship Program</p>
          <h1 className="text-2xl font-bold text-gray-900">Employer Training Site Onboarding</h1>
          <p className="text-sm text-black mt-1">2Exclusive LLC-S (DBA: Elevate for Humanity Technical and Career Institute) · RAPIDS: 2025-IN-132301</p>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-5">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i < stepIndex ? 'bg-green-500 text-white' :
                  i === stepIndex ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-black'
                }`}>
                  {i < stepIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${i === stepIndex ? 'text-blue-600' : 'text-black'}`}>{s.label}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < stepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">
            {STEPS[stepIndex]?.label}
          </h2>

          {step === 'profile' && (
            <ProfileStep onNext={(data) => { setProfileData(data); setStep('mou'); }} />
          )}
          {step === 'mou' && (
            <MOUStep profileData={profileData} onNext={() => setStep('agreement')} />
          )}
          {step === 'agreement' && (
            <EmployerAgreementStep profileData={profileData} onNext={() => setStep('done')} />
          )}
          {step === 'done' && (
            <div className="text-center space-y-4 py-8">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              <h3 className="text-2xl font-bold text-gray-900">Onboarding Complete!</h3>
              <p className="text-black">Thank you, {profileData.owner_name}. Your profile, MOU, and Employer Agreement have been submitted. Elevate for Humanity will review and confirm within 2 business days. You will receive a confirmation email at {profileData.contact_email}.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 text-left">
                <p className="font-semibold mb-2">Next Steps:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Elevate will verify your licenses and insurance</li>
                  <li>Your shop will be registered in RAPIDS as an approved training site</li>
                  <li>Apprentice placements will begin once verification is complete</li>
                  <li>You will receive your Employer Training Site ID by email</li>
                </ul>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
