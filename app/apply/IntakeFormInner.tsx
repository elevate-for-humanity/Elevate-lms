'use client';
import { useState, useRef } from 'react';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import Link from 'next/link';
import { ArrowRight, Upload, X, FileText, AlertCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// ── Validation helpers ────────────────────────────────────────────────────────

function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address.';
  return null;
}

function validatePhone(v: string): string | null {
  if (!v.trim()) return null; // phone is optional
  const digits = v.replace(/\D/g, '');
  if (digits.length < 10) return 'Phone number must be at least 10 digits.';
  return null;
}

function validateName(v: string): string | null {
  if (!v.trim()) return 'Full name is required.';
  if (v.trim().length < 2) return 'Name must be at least 2 characters.';
  if (v.trim().split(/\s+/).length < 2) return 'Please enter your first and last name.';
  return null;
}

function validateDOB(v: string): string | null {
  if (!v) return 'Date of birth is required.';
  const dob = new Date(v);
  if (isNaN(dob.getTime())) return 'Enter a valid date.';
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear() -
    (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
  if (age < 16) return 'You must be at least 16 years old to apply.';
  if (age > 100) return 'Please enter a valid date of birth.';
  return null;
}

function validateCounty(v: string): string | null {
  if (!v.trim()) return 'County of residence is required.';
  return null;
}

// ── Document upload types ─────────────────────────────────────────────────────

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const DOCUMENT_TYPES = [
  { value: 'government_id',   label: 'Government-Issued ID (driver\'s license, state ID, passport)' },
  { value: 'income_proof',    label: 'Proof of Income (pay stub, tax return, benefit letter)' },
  { value: 'residency_proof', label: 'Proof of Residency (utility bill, lease, mail)' },
  { value: 'school_transcript', label: 'School Transcript or Diploma / GED' },
  { value: 'other',           label: 'Other Supporting Document' },
] as const;

interface UploadedDoc {
  file: File;
  docType: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
}

// ── Phone auto-format ─────────────────────────────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

interface Program { id: string; title: string; slug: string }

function IntakeForm({ programs = [] }: { programs?: Program[] }) {
  const searchParams = useSafeSearchParams();
  const programParam = searchParams.get('program') || '';

  // Map legacy/alias slugs → canonical registry slugs
  const SLUG_TO_VALUE: Record<string, string> = {
    // HVAC
    hvac: 'hvac-technician',
    'hvac-tech': 'hvac-technician',
    // Barber
    barbering: 'barber-apprenticeship',
    barber: 'barber-apprenticeship',
    // CNA
    cna: 'cna',
    'cna-cert': 'cna',
    'cna-certification': 'cna',
    'certified-nursing-assistant': 'cna',
    'cna-training': 'cna',
    // CDL
    cdl: 'cdl-training',
    'cdl-class-a': 'cdl-training',
    // Phlebotomy
    phlebotomy: 'phlebotomy',
    'phlebotomy-technician': 'phlebotomy',
    // IT
    'it-support': 'it-help-desk',
    // Cybersecurity
    cybersecurity: 'cybersecurity-analyst',
    // CPR
    'cpr-first-aid-hsi': 'cpr-first-aid',
    cpr: 'cpr-first-aid',
  };
  const initialProgram = SLUG_TO_VALUE[programParam] || programParam || '';
  // Barber is a self-pay apprenticeship — simplify the form for this program
  const isBarberProgram = initialProgram === 'barber-apprenticeship';
  const isCprProgram = initialProgram === 'cpr-first-aid';
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fundingTag, setFundingTag] = useState('');
  const [submittedProgram, setSubmittedProgram] = useState('');
  const [error, setError] = useState('');

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Phone controlled value for auto-formatting
  const [phone, setPhone] = useState('');

  // Document uploads
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [newDocType, setNewDocType] = useState<string>(DOCUMENT_TYPES[0].value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validateAll(data: Record<string, FormDataEntryValue>): Record<string, string> {
    const errs: Record<string, string> = {};
    const nameErr = validateName(data.full_name as string ?? '');
    if (nameErr) errs.full_name = nameErr;
    const emailErr = validateEmail(data.email as string ?? '');
    if (emailErr) errs.email = emailErr;
    const phoneErr = validatePhone(data.phone as string ?? '');
    if (phoneErr) errs.phone = phoneErr;
    const dobErr = validateDOB(data.date_of_birth as string ?? '');
    if (dobErr) errs.date_of_birth = dobErr;
    const countyErr = validateCounty(data.county as string ?? '');
    if (countyErr) errs.county = countyErr;
    return errs;
  }

  function addFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only PDF, JPEG, PNG, and WebP files are accepted.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`"${file.name}" exceeds the 10 MB limit.`);
      return;
    }
    setError('');
    setDocs(prev => [...prev, { file, docType: newDocType, status: 'pending' }]);
  }

  function removeDoc(idx: number) {
    setDocs(prev => prev.filter((_, i) => i !== idx));
  }

  async function uploadDocs(): Promise<string[]> {
    const urls: string[] = [];
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (doc.status === 'done' && doc.url) { urls.push(doc.url); continue; }
      setDocs(prev => prev.map((d, idx) => idx === i ? { ...d, status: 'uploading' } : d));
      try {
        const fd = new FormData();
        fd.append('file', doc.file);
        fd.append('docType', doc.docType);
        const res = await fetch('/api/intake/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Upload failed');
        setDocs(prev => prev.map((d, idx) => idx === i ? { ...d, status: 'done', url: json.url } : d));
        urls.push(json.url);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setDocs(prev => prev.map((d, idx) => idx === i ? { ...d, status: 'error', error: msg } : d));
      }
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Client-side validation
    const errs = validateAll(data);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      // Scroll to first error
      const firstKey = Object.keys(errs)[0];
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setFieldErrors({});

    setLoading(true);

    // Upload documents first (non-blocking — failures don't abort submission)
    const documentUrls = docs.length > 0 ? await uploadDocs() : [];

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, document_urls: documentUrls }),
      });

      const result = await res.json();

      if (res.ok) {
        setMirrorWarning(Boolean(result.mirror_failed));
        setSubmittedProgram((data.program_interest as string) || '');
        setSubmitted(true);
        setFundingTag(result.funding_tag || '');
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    }

    setLoading(false);
  }

  if (submitted) {
    const isBarber = submittedProgram === 'barber-apprenticeship';
    const isCpr = submittedProgram === 'cpr-first-aid';
    const isBarberSelfPay = isBarber && fundingTag === 'self-pay';
    const isCprSelfPay = isCpr && (fundingTag === 'self-pay' || fundingTag === '');

    // CPR self-pay: BNPL / card checkout
    if (isCprSelfPay) {
      return (
        <div className="min-h-screen bg-white">
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Application Received</h1>
            <p className="text-lg text-slate-700 mb-2">
              Complete your $130 CPR &amp; First Aid enrollment to reserve your training date.
            </p>
            <p className="text-sm text-slate-600 mb-8">
              Pay in full or use Buy Now, Pay Later (Klarna, Afterpay, and more).
            </p>
            <Link
              href="/programs/cpr-first-aid/payment/bnpl"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Continue to Checkout →
            </Link>
          </div>
        </div>
      );
    }

    // Barber self-pay: send directly to payment cart
    if (isBarberSelfPay) {
      return (
        <div className="min-h-screen bg-white">
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Application Received</h1>
            <p className="text-lg text-slate-700 mb-2">
              You&apos;re one step away from enrolling in the Barber Apprenticeship.
            </p>
            <p className="text-sm text-slate-600 mb-8">
              Set up your payment plan now to secure your spot. Takes 2 minutes.
            </p>
            <Link
              href="/programs/barber-apprenticeship/payment-setup"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Set Up Payment Plan →
            </Link>
            <p className="mt-4 text-xs text-slate-400">
              Check your email for a confirmation and your account login link.
            </p>
          </div>
        </div>
      );
    }

    // All other programs / funding paths
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-black flex-shrink-0">•</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Application Received</h1>
          <p className="text-lg text-black mb-2">
            Thank you for your interest in {PLATFORM_DEFAULTS.orgName}.
          </p>
          <p className="text-sm text-black mb-2">
            Check your email — we sent you a link to access your learner account and track your
            application status.
          </p>
          {fundingTag === 'jri' && (
            <p className="text-base text-slate-700 mb-6">
              Based on your responses, you may qualify for Job Ready Indy funding. Our team will
              review your eligibility and contact you within 2 business days.
            </p>
          )}
          {isBarber && fundingTag !== 'self-pay' && (
            <p className="text-base text-slate-700 mb-6">
              We&apos;ll review your funding eligibility for the Barber Apprenticeship and contact you within 2 business days.
              If funding isn&apos;t available, we&apos;ll walk you through payment options.
            </p>
          )}
          {!isBarber && fundingTag === 'self-pay' && (
            <p className="text-base text-slate-700 mb-6">
              We&apos;ve noted your self-pay preference. Our enrollment team will contact you with
              program details and payment options within 2 business days.
            </p>
          )}
          {(fundingTag === 'wioa' || fundingTag === 'wioa-categorical' || fundingTag === 'wioa-income' || fundingTag === 'pending-review') && !isBarber && (
            <p className="text-base text-slate-700 mb-6">
              We will review your funding eligibility and contact you within 2 business days. You
              may qualify for WIOA, WRG, or other workforce funding.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              href="/programs"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center"
            >
              Browse Programs
            </Link>
            <Link
              href="/"
              className="bg-white hover:bg-slate-200 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-2xl mx-auto px-4">
          {isBarberProgram ? (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-2">Barber Apprenticeship</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Apply to Enroll</h1>
              <p className="text-slate-300 text-base">
                Takes 3–5 minutes. After submitting, you&apos;ll set up your payment plan and get access to the program.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Funding &amp; Apprenticeship Intake</h1>
              <p className="text-slate-300 text-base">
                This form screens your eligibility for workforce-funded training programs including
                WIOA, WRG, and Job Ready Indy. Funding is not guaranteed and requires partner review.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          {error && (
            <div
              className="bg-brand-red-50 border border-brand-red-200 text-brand-red-800 px-4 py-3 rounded-lg mb-6"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    autoComplete="name"
                    placeholder="First and last name"
                    className={`w-full border bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 ${fieldErrors.full_name ? 'border-red-500' : 'border-slate-300'}`}
                    onBlur={e => {
                      const err = validateName(e.target.value);
                      setFieldErrors(prev => err ? { ...prev, full_name: err } : (({ full_name: _, ...rest }) => rest)(prev));
                    }}
                  />
                  {fieldErrors.full_name && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.full_name}</p>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={`w-full border bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 ${fieldErrors.email ? 'border-red-500' : 'border-slate-300'}`}
                      onBlur={e => {
                        const err = validateEmail(e.target.value);
                        setFieldErrors(prev => err ? { ...prev, email: err } : (({ email: _, ...rest }) => rest)(prev));
                      }}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(317) 555-0100"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      className={`w-full border bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 ${fieldErrors.phone ? 'border-red-500' : 'border-slate-300'}`}
                      onBlur={e => {
                        const err = validatePhone(e.target.value);
                        setFieldErrors(prev => err ? { ...prev, phone: err } : (({ phone: _, ...rest }) => rest)(prev));
                      }}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.phone}</p>
                    )}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-semibold text-slate-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full border bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 ${fieldErrors.date_of_birth ? 'border-red-500' : 'border-slate-300'}`}
                      onBlur={e => {
                        const err = validateDOB(e.target.value);
                        setFieldErrors(prev => err ? { ...prev, date_of_birth: err } : (({ date_of_birth: _, ...rest }) => rest)(prev));
                      }}
                    />
                    {fieldErrors.date_of_birth && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.date_of_birth}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="county" className="block text-sm font-semibold text-slate-700 mb-1">
                      County of Residence *
                    </label>
                    <input
                      id="county"
                      name="county"
                      placeholder="e.g. Marion, Hamilton"
                      className={`w-full border bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 ${fieldErrors.county ? 'border-red-500' : 'border-slate-300'}`}
                      onBlur={e => {
                        const err = validateCounty(e.target.value);
                        setFieldErrors(prev => err ? { ...prev, county: err } : (({ county: _, ...rest }) => rest)(prev));
                      }}
                    />
                    {fieldErrors.county && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.county}</p>
                    )}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      defaultValue="IN"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Program Interest */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Program Interest</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="program_interest"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Which program are you interested in?
                  </label>
                  <select
                    id="program_interest"
                    name="program_interest"
                    defaultValue={initialProgram || 'barber-apprenticeship'}
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.slug}>{p.title}</option>
                    ))}
                    <optgroup label="External Pathways (Google / Microsoft)">
                      <option value="google-it-support">Google IT Support Certificate</option>
                      <option value="google-cybersecurity">Google Cybersecurity Certificate</option>
                      <option value="google-data-analytics">Google Data Analytics Certificate</option>
                      <option value="google-project-management">Google Project Management Certificate</option>
                      <option value="microsoft-azure-fundamentals">Microsoft Azure Fundamentals (AZ-900)</option>
                      <option value="microsoft-365-fundamentals">Microsoft 365 Fundamentals (MS-900)</option>
                    </optgroup>
                    <option value="other">Other / Not Listed</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="preferred_location"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Preferred Training Location
                  </label>
                  <input
                    id="preferred_location"
                    name="preferred_location"
                    placeholder="e.g. Indianapolis, Kokomo"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Funding Eligibility */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Funding Eligibility</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="employment_status"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Current Employment Status
                  </label>
                  <select
                    id="employment_status"
                    name="employment_status"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    <option value="">Select...</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="part-time">Part-Time Employed</option>
                    <option value="full-time">Full-Time Employed</option>
                    <option value="self-employed">Self-Employed / Business Owner</option>
                    <option value="independent-contractor">Independent Contractor / 1099</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                {/* Barber is self-pay — hide the funding question and default to false */}
                {isBarberProgram ? (
                  <input type="hidden" name="funding_needed" value="false" />
                ) : (
                  <div>
                    <label
                      htmlFor="funding_needed"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Do you need funding assistance?
                    </label>
                    <select
                      id="funding_needed"
                      name="funding_needed"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="true">Yes, I need funding assistance</option>
                      <option value="false">No, I can self-pay</option>
                    </select>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="probation_or_reentry"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Are you connected to probation, reentry, or community corrections?
                  </label>
                  <select
                    id="probation_or_reentry"
                    name="probation_or_reentry"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                {/* WIOA income/benefits/barriers — not relevant for barber self-pay */}
                {!isBarberProgram && <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="household_size"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Household Size
                    </label>
                    <select
                      id="household_size"
                      name="household_size"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="">Select...</option>
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <option key={n} value={n}>{n}{n === 8 ? '+' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="annual_income"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Annual Household Income
                    </label>
                    <select
                      id="annual_income"
                      name="annual_income"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="">Select...</option>
                      <option value="0-15000">Under $15,000</option>
                      <option value="15000-25000">$15,000 – $25,000</option>
                      <option value="25000-35000">$25,000 – $35,000</option>
                      <option value="35000-50000">$35,000 – $50,000</option>
                      <option value="50000+">Over $50,000</option>
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="snap_recipient"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Do you receive SNAP (food stamps)?
                    </label>
                    <select
                      id="snap_recipient"
                      name="snap_recipient"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="tanf_recipient"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Do you receive TANF / cash assistance?
                    </label>
                    <select
                      id="tanf_recipient"
                      name="tanf_recipient"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>
                {/* WIOA eligibility fields */}
                <div>
                  <label
                    htmlFor="education_level"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Highest Education Level Completed
                  </label>
                  <select
                    id="education_level"
                    name="education_level"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    <option value="">Select...</option>
                    <option value="less-than-hs">Less than high school</option>
                    <option value="hs-diploma">High school diploma</option>
                    <option value="ged">GED / HiSET</option>
                    <option value="some-college">Some college (no degree)</option>
                    <option value="associates">Associate&apos;s degree</option>
                    <option value="bachelors">Bachelor&apos;s degree or higher</option>
                  </select>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="work_authorization"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Authorized to work in the U.S.?
                    </label>
                    <select
                      id="work_authorization"
                      name="work_authorization"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="selective_service"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Selective Service registered? <span className="font-normal text-slate-500">(males 18–25 only)</span>
                    </label>
                    <select
                      id="selective_service"
                      name="selective_service"
                      className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                    >
                      <option value="na">N/A</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
                {/* Race/ethnicity — voluntary, required for WIOA demographic reporting */}
                <div>
                  <label
                    htmlFor="ethnicity"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Race / Ethnicity <span className="font-normal text-slate-500">(voluntary — required for federal reporting)</span>
                  </label>
                  <select
                    id="ethnicity"
                    name="ethnicity"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    <option value="">Prefer not to answer</option>
                    <option value="hispanic-latino">Hispanic or Latino</option>
                    <option value="american-indian">American Indian or Alaska Native</option>
                    <option value="asian">Asian</option>
                    <option value="black">Black or African American</option>
                    <option value="native-hawaiian">Native Hawaiian or Other Pacific Islander</option>
                    <option value="white">White</option>
                    <option value="two-or-more">Two or more races</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Barriers to Employment (select all that apply)
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      { value: 'homeless', label: 'Homeless / Housing Instability' },
                      { value: 'ex-offender', label: 'Ex-Offender / Justice-Involved' },
                      { value: 'veteran', label: 'Veteran / Military Spouse' },
                      { value: 'disability', label: 'Disability' },
                      { value: 'basic-skills', label: 'Basic Skills Deficient' },
                      { value: 'english-learner', label: 'English Language Learner' },
                      { value: 'single-parent', label: 'Single Parent' },
                      { value: 'foster-youth', label: 'Foster Youth / Aged Out' },
                      { value: 'transportation', label: 'Lack of Transportation' },
                      { value: 'childcare', label: 'Childcare Needs' },
                    ].map(b => (
                      <label key={b.value} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          name="barriers"
                          value={b.value}
                          className="rounded border-slate-300 text-brand-red-600 focus:ring-brand-red-500"
                        />
                        {b.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="workforce_connection"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Are you connected to any workforce services?
                  </label>
                  <select
                    id="workforce_connection"
                    name="workforce_connection"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    <option value="">None / Not sure</option>
                    <option value="workone">WorkOne Indiana</option>
                    <option value="fssa">FSSA (Family &amp; Social Services Administration)</option>
                    <option value="employer-indy">EmployIndy</option>
                    <option value="goodwill">Goodwill</option>
                    <option value="reclaim-academy">Reclaim Academy</option>
                    <option value="other">Other workforce program</option>
                  </select>
                </div>
                </>}
              </div>
            </div>

            {/* Document Upload */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Supporting Documents</h2>
              <p className="text-sm text-slate-500 mb-4">
                Optional but recommended. Upload ID, income proof, or other documents to speed up your eligibility review.
                Accepted: PDF, JPEG, PNG · Max 10 MB per file.
              </p>

              {/* Existing uploads */}
              {docs.length > 0 && (
                <div className="space-y-2 mb-4">
                  {docs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-slate-50">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{doc.file.name}</p>
                        <p className="text-xs text-slate-500">
                          {DOCUMENT_TYPES.find(d => d.value === doc.docType)?.label ?? doc.docType}
                          {' · '}{(doc.file.size / 1024).toFixed(0)} KB
                        </p>
                        {doc.status === 'uploading' && (
                          <p className="text-xs text-brand-blue-600 mt-0.5">Uploading…</p>
                        )}
                        {doc.status === 'done' && (
                          <p className="text-xs text-emerald-600 mt-0.5">✓ Uploaded</p>
                        )}
                        {doc.status === 'error' && (
                          <p className="text-xs text-red-600 mt-0.5">⚠ {doc.error}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDoc(i)}
                        className="p-1 text-slate-400 hover:text-red-500 transition shrink-0"
                        aria-label="Remove document"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add document row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={newDocType}
                  onChange={e => setNewDocType(e.target.value)}
                  className="flex-1 border border-slate-300 bg-white text-slate-900 p-3 rounded-lg text-sm focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                >
                  {DOCUMENT_TYPES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg border-2 border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:border-brand-red-400 hover:text-brand-red-600 transition bg-white shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) addFile(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="referral_source"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    How did you hear about us?
                  </label>
                  <select
                    id="referral_source"
                    name="referral_source"
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  >
                    <option value="">Select...</option>
                    <option value="website">Website</option>
                    <option value="social-media">Social Media</option>
                    <option value="referral">Friend / Family Referral</option>
                    <option value="workforce-partner">Workforce Partner</option>
                    <option value="probation-officer">Probation / Parole Officer</option>
                    <option value="community-event">Community Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Tell us about your goals (optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-black">
              By submitting, you authorize {PLATFORM_DEFAULTS.orgName} to review your intake for training
              and funding pathways. Final funding decisions are made by workforce partners and are
              not guaranteed. See our{' '}
              <Link href="/legal/privacy" className="text-brand-red-600 underline">
                privacy policy
              </Link>
              {' '}and{' '}
              <Link href="/impact/methodology" className="text-brand-red-600 underline">
                impact methodology
              </Link>
              .
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-400 text-white text-lg font-bold p-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  Check Eligibility & Apply <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

// No Suspense boundary needed — useSafeSearchParams reads from context
// provided by SafeSearchParamsProvider in PublicLayout.
export default function IntakeFormInner({ programs = [] }: { programs?: Program[] }) {
  return <IntakeForm programs={programs} />;
}
