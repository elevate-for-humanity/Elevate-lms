'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { TESTING_CENTER } from '@/lib/testing/testing-config';
import { AlertTriangle, CheckCircle, ChevronRight, Mail, Phone, Upload, Loader2, FileCheck, Send } from 'lucide-react';

export default function TestingAccommodationsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    provider: '',
    examDate: '',
    accommodationType: '',
    details: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationId, setConfirmationId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const minDate = new Date(today.setDate(today.getDate() + 30))
    .toISOString()
    .split('T')[0];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.size <= 10 * 1024 * 1024) {
      setFile(selected);
    } else if (selected) {
      alert('File must be under 10MB');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append('documentation', file);

      const res = await fetch('/api/testing/accommodations', {
        method: 'POST',
        body: formDataToSend,
      });

      if (res.ok) {
        const data = await res.json();
        setConfirmationId(data.confirmationId || `ACQ-${Date.now()}`);
        setSubmitted(true);
      } else {
        throw new Error('Submission failed');
      }
    } catch {
      alert('Unable to submit request. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="bg-[#1E3A5F] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-brand-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Certification Testing
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Testing Accommodations
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            We are committed to providing equal access to all candidates. Accommodation requests
            must be submitted at least 30 days before your exam date.
          </p>
        </div>
      </section>

      {/* DEADLINE WARNING */}
      <section className="bg-amber-50 border-b border-amber-200 py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm leading-relaxed">
            <strong className="text-amber-900">30-Day Deadline.</strong> Accommodation requests must
            be submitted at least 30 days before your exam date. Submit early — late requests cannot
            be guaranteed.
          </p>
        </div>
      </section>

      {/* AVAILABLE ACCOMMODATIONS */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Available Accommodations</h2>
          <p className="text-slate-500 text-sm mb-8">
            All accommodations require supporting documentation from a licensed professional.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACCOMMODATION_TYPES.map((item) => (
              <div
                key={item.title}
                className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                    <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW TO REQUEST */}
      <section className="bg-slate-50 border-y border-slate-200 py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">
            How to Request Accommodations
          </h2>
          <p className="text-slate-500 text-sm text-center mb-10">
            Four steps to get your accommodations approved before exam day.
          </p>
          <div className="space-y-6">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-[#1E3A5F] text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-slate-500 text-sm mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURE REQUEST FORM */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Submit Accommodation Request</h2>
            <p className="text-slate-500 text-sm">
              Complete the form below to securely submit your accommodation request and documentation.
              All information is encrypted and handled with strict confidentiality.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Request Submitted Successfully</h3>
              <p className="text-slate-600 mb-4">
                Your accommodation request has been received. Our team will review your documentation
                and contact you within 5–7 business days to confirm approved accommodations.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Reference: <span className="font-mono font-semibold">{confirmationId}</span>
              </p>
              <Link
                href="/testing/book"
                className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-full transition-colors"
              >
                Schedule Your Exam <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5"
            >
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Smith"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="jane@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 555-5555"
                />
              </div>

              {/* Exam Provider */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Exam Provider <span className="text-red-500">*</span>
                </label>
                <select
                  name="provider"
                  required
                  value={formData.provider}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select exam provider</option>
                  <option value="nha">NHA – National Healthcareer Association</option>
                  <option value="epa">EPA 608 – Clean Air Act</option>
                  <option value="act">ACT WorkKeys</option>
                  <option value="comptia">CompTIA</option>
                  <option value="other">Other / Not Sure</option>
                </select>
              </div>

              {/* Exam Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Intended Exam Date
                </label>
                <input
                  type="date"
                  name="examDate"
                  value={formData.examDate}
                  onChange={handleChange}
                  min={minDate}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Accommodation requests require at least 30 days advance notice.
                </p>
              </div>

              {/* Accommodation Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Requested Accommodation <span className="text-red-500">*</span>
                </label>
                <select
                  name="accommodationType"
                  required
                  value={formData.accommodationType}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select accommodation type</option>
                  <option value="extended_time">Extended Time (1.5x or 2x)</option>
                  <option value="screen_reader">Screen Reader / Assistive Technology</option>
                  <option value="large_print">Large Print</option>
                  <option value="separate_room">Separate Testing Room</option>
                  <option value="frequent_breaks">Frequent Breaks</option>
                  <option value="other">Other (describe below)</option>
                </select>
              </div>

              {/* Details */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Additional Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="details"
                  required
                  value={formData.details}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Describe your disability and the accommodations you are requesting. Be as specific as possible."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Supporting Documentation <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">{file.name}</span>
                      <span className="text-xs text-green-600">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 font-medium">
                        Click to upload documentation
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        PDF, PNG, JPG, DOC up to 10MB
                      </p>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Required: Letter from licensed professional (physician, psychologist, or specialist)
                  describing your disability and requested accommodations.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !file}
                className="w-full bg-[#1E3A5F] hover:bg-[#162d4a] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Accommodation Request
                  </>
                )}
              </button>

              {!file && (
                <p className="text-xs text-amber-600 text-center">
                  Documentation is required to process your request.
                </p>
              )}

              <div className="flex items-center justify-center gap-4 pt-2">
                <a
                  href={`tel:${TESTING_CENTER.phoneTel}`}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                >
                  <Phone className="w-4 h-4" />
                  {TESTING_CENTER.phone}
                </a>
                <span className="text-slate-300">|</span>
                <a
                  href={`mailto:${TESTING_CENTER.email}`}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                >
                  <Mail className="w-4 h-4" />
                  Email Us
                </a>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 px-4 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-slate-500 text-sm mb-4">Ready to schedule your exam?</p>
          <Link
            href="/testing/book"
            className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-full transition-colors"
          >
            Schedule Your Exam <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

const ACCOMMODATION_TYPES = [
  {
    title: 'Extended Time',
    desc: 'Time-and-a-half or double time for candidates with documented disabilities.',
  },
  {
    title: 'Screen Reader',
    desc: 'Assistive technology support for visually impaired candidates.',
  },
  { title: 'Large Print', desc: 'Enlarged exam materials for candidates with visual impairments.' },
  { title: 'Separate Testing Room', desc: 'Private testing environment to minimize distractions.' },
  {
    title: 'Frequent Breaks',
    desc: 'Scheduled breaks during the exam for candidates who require them.',
  },
  {
    title: 'Other',
    desc: 'Additional accommodations reviewed on a case-by-case basis with supporting documentation.',
  },
];

const STEPS = [
  {
    step: '1',
    title: 'Submit at least 30 days before your exam',
    desc: 'Accommodation requests must be received no later than 30 days before your scheduled exam date. Late requests may not be processed in time.',
  },
  {
    step: '2',
    title: 'Provide supporting documentation',
    desc: 'Include documentation from a licensed professional (physician, psychologist, or specialist) describing your disability and the accommodations required.',
  },
  {
    step: '3',
    title: 'Receive confirmation',
    desc: 'We will review your request and confirm approved accommodations within 5–7 business days of receiving complete documentation.',
  },
  {
    step: '4',
    title: 'Schedule your exam',
    desc: 'Once accommodations are confirmed, schedule your exam through our testing center. Your approved accommodations will be applied automatically.',
  },
];

export default function TestingAccommodationsPage() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="bg-[#1E3A5F] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-brand-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Certification Testing
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Testing Accommodations
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            We are committed to providing equal access to all candidates. Accommodation requests
            must be submitted at least 30 days before your exam date.
          </p>
        </div>
      </section>

      {/* DEADLINE WARNING */}
      <section className="bg-amber-50 border-b border-amber-200 py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm leading-relaxed">
            <strong className="text-amber-900">30-Day Deadline.</strong> Accommodation requests must
            be submitted at least 30 days before your exam date. Submit early — late requests cannot
            be guaranteed.
          </p>
        </div>
      </section>

      {/* AVAILABLE ACCOMMODATIONS */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Available Accommodations</h2>
          <p className="text-slate-500 text-sm mb-8">
            All accommodations require supporting documentation from a licensed professional.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACCOMMODATION_TYPES.map((item) => (
              <div
                key={item.title}
                className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                    <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW TO REQUEST */}
      <section className="bg-slate-50 border-y border-slate-200 py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">
            How to Request Accommodations
          </h2>
          <p className="text-slate-500 text-sm text-center mb-10">
            Four steps to get your accommodations approved before exam day.
          </p>
          <div className="space-y-6">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-[#1E3A5F] text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-slate-500 text-sm mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURE REQUEST FORM */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Submit Accommodation Request</h2>
            <p className="text-slate-500 text-sm">
              Complete the form below to securely submit your accommodation request and documentation.
              All information is encrypted and handled with strict confidentiality.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Request Submitted Successfully</h3>
              <p className="text-slate-600 mb-4">
                Your accommodation request has been received. Our team will review your documentation
                and contact you within 5–7 business days to confirm approved accommodations.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Reference: <span className="font-mono font-semibold">{confirmationId}</span>
              </p>
              <Link
                href="/testing/book"
                className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-full transition-colors"
              >
                Schedule Your Exam <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5"
            >
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Smith"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="jane@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 555-5555"
                />
              </div>

              {/* Exam Provider */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Exam Provider <span className="text-red-500">*</span>
                </label>
                <select
                  name="provider"
                  required
                  value={formData.provider}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select exam provider</option>
                  <option value="nha">NHA – National Healthcareer Association</option>
                  <option value="epa">EPA 608 – Clean Air Act</option>
                  <option value="act">ACT WorkKeys</option>
                  <option value="comptia">CompTIA</option>
                  <option value="other">Other / Not Sure</option>
                </select>
              </div>

              {/* Exam Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Intended Exam Date
                </label>
                <input
                  type="date"
                  name="examDate"
                  value={formData.examDate}
                  onChange={handleChange}
                  min={minDate}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Accommodation requests require at least 30 days advance notice.
                </p>
              </div>

              {/* Accommodation Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Requested Accommodation <span className="text-red-500">*</span>
                </label>
                <select
                  name="accommodationType"
                  required
                  value={formData.accommodationType}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select accommodation type</option>
                  <option value="extended_time">Extended Time (1.5x or 2x)</option>
                  <option value="screen_reader">Screen Reader / Assistive Technology</option>
                  <option value="large_print">Large Print</option>
                  <option value="separate_room">Separate Testing Room</option>
                  <option value="frequent_breaks">Frequent Breaks</option>
                  <option value="other">Other (describe below)</option>
                </select>
              </div>

              {/* Details */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Additional Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="details"
                  required
                  value={formData.details}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Describe your disability and the accommodations you are requesting. Be as specific as possible."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Supporting Documentation <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">{file.name}</span>
                      <span className="text-xs text-green-600">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 font-medium">
                        Click to upload documentation
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        PDF, PNG, JPG, DOC up to 10MB
                      </p>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Required: Letter from licensed professional (physician, psychologist, or specialist)
                  describing your disability and requested accommodations.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !file}
                className="w-full bg-[#1E3A5F] hover:bg-[#162d4a] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Accommodation Request
                  </>
                )}
              </button>

              {!file && (
                <p className="text-xs text-amber-600 text-center">
                  Documentation is required to process your request.
                </p>
              )}

              <div className="flex items-center justify-center gap-4 pt-2">
                <a
                  href={`tel:${TESTING_CENTER.phoneTel}`}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                >
                  <Phone className="w-4 h-4" />
                  {TESTING_CENTER.phone}
                </a>
                <span className="text-slate-300">|</span>
                <a
                  href={`mailto:${TESTING_CENTER.email}`}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                >
                  <Mail className="w-4 h-4" />
                  Email Us
                </a>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 px-4 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-slate-500 text-sm mb-4">Ready to schedule your exam?</p>
          <Link
            href="/testing/book"
            className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-full transition-colors"
          >
            Schedule Your Exam <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}

function AccommodationsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    provider: '',
    examDate: '',
    accommodationType: '',
    details: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationId, setConfirmationId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const minDate = new Date(today.setDate(today.getDate() + 30))
    .toISOString()
    .split('T')[0];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.size <= 10 * 1024 * 1024) {
      setFile(selected);
    } else if (selected) {
      alert('File must be under 10MB');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append('documentation', file);

      const res = await fetch('/api/testing/accommodations', {
        method: 'POST',
        body: formDataToSend,
      });

      if (res.ok) {
        const data = await res.json();
        setConfirmationId(data.confirmationId || `ACQ-${Date.now()}`);
        setSubmitted(true);
      } else {
        throw new Error('Submission failed');
      }
    } catch {
      alert('Unable to submit request. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return <AccommodationsContent />;
}

export default function TestingAccommodationsPage() {
  return <AccommodationsPage />;
}
