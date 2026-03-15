'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Briefcase, MapPin, Clock, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function CareerApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedIn: '',
    portfolio: '',
    coverLetter: '',
    experience: '',
    availability: '',
    salary: '',
    heardAbout: '',
  });
  const [resume, setResume] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const supabase = createClient();
      let resumeUrl = '';

      // Get user first — RLS requires auth.uid() as first path segment
      const { data: { user } } = await supabase.auth.getUser();

      // Upload resume if provided — via API route (bypasses storage RLS)
      if (resume) {
        const fd = new FormData();
        fd.append('file', resume);
        fd.append('documentType', 'resume');
        fd.append('metadata', JSON.stringify({ jobPostingId: id }));
        const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: fd });
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.error || 'Resume upload failed');
        resumeUrl = uploadResult.document?.file_url || '';
      }

      const { error: insertErr } = await supabase
        .from('job_applications')
        .insert({
          job_posting_id: id,
          student_id: user?.id || null,
          resume_url: resumeUrl,
          cover_letter: formData.coverLetter,
          notes: [
            `Name: ${formData.firstName} ${formData.lastName}`,
            `Email: ${formData.email}`,
            `Phone: ${formData.phone}`,
            formData.linkedIn ? `LinkedIn: ${formData.linkedIn}` : '',
            formData.portfolio ? `Portfolio: ${formData.portfolio}` : '',
            `Experience: ${formData.experience}`,
            `Availability: ${formData.availability}`,
            formData.salary ? `Salary: ${formData.salary}` : '',
            formData.heardAbout ? `Source: ${formData.heardAbout}` : '',
          ].filter(Boolean).join('\n'),
          status: 'submitted',
        });

      if (insertErr) throw new Error(insertErr.message);

      // Fire application_received + thank_you_applying emails
      const emailBase = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        position: '', // populated server-side from job_posting
      };
      await Promise.allSettled([
        fetch('/api/hr/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'application_received', params: emailBase }),
        }),
        fetch('/api/hr/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'thank_you_applying', params: emailBase }),
        }),
      ]);

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h1>
            <p className="text-gray-600 mb-8">
              Thank you for your interest in joining Elevate for Humanity. 
              We&apos;ll review your application and get back to you within 5-7 business days.
            </p>
            <div className="space-y-4">
              <Link 
                href="/careers"
                className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition"
              >
                View More Positions
              </Link>
              <p className="text-sm text-gray-500">
                Questions? Email us at <a href="/contact" className="text-brand-blue-600">Contact Us</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Careers", href: "/careers" }, { label: "[Id]" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <Link href="/careers" className="inline-flex items-center text-brand-blue-600 hover:text-brand-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Careers
        </Link>

        {/* Job Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Apply for Position</h1>
          <div className="flex flex-wrap gap-4 text-gray-600">
            <span className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Full-time
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Indianapolis, IN
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Immediate Start
            </span>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Information</h2>
          
          {/* Personal Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                placeholder="Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                placeholder="john@elevateforhumanity.org"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                placeholder="(317) 314-3757"
              />
            </div>
          </div>

          {/* Links */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
              <input
                type="url"
                value={formData.linkedIn}
                onChange={(e) => setFormData({...formData, linkedIn: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio/Website</label>
              <input
                type="url"
                value={formData.portfolio}
                onChange={(e) => setFormData({...formData, portfolio: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>

          {/* Resume Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Resume/CV *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand-blue-500 transition cursor-pointer">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResume(e.target.files?.[0] || null)}
                className="hidden"
                id="resume-upload"
                required
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                {resume ? (
                  <p className="text-brand-green-600 font-medium">{resume.name}</p>
                ) : (
                  <>
                    <p className="text-gray-600 font-medium">Click to upload your resume</p>
                    <p className="text-sm text-gray-500 mt-1">PDF, DOC, or DOCX (max 5MB)</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
            <textarea
              value={formData.coverLetter}
              onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="Tell us why you're interested in this position and what makes you a great fit..."
            />
          </div>

          {/* Experience */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Relevant Experience *</label>
            <textarea
              required
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="Briefly describe your relevant experience and qualifications..."
            />
          </div>

          {/* Additional Questions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Availability *</label>
              <select
                required
                value={formData.availability}
                onChange={(e) => setFormData({...formData, availability: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              >
                <option value="">Select availability</option>
                <option value="immediate">Immediately</option>
                <option value="2weeks">2 weeks notice</option>
                <option value="1month">1 month notice</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salary Expectations</label>
              <input
                type="text"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                placeholder="e.g., $50,000 - $60,000"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">How did you hear about us?</label>
            <select
              value={formData.heardAbout}
              onChange={(e) => setFormData({...formData, heardAbout: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">Select an option</option>
              <option value="linkedin">LinkedIn</option>
              <option value="indeed">Indeed</option>
              <option value="website">Company Website</option>
              <option value="referral">Employee Referral</option>
              <option value="social">Social Media</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-6 border-t">
            <p className="text-sm text-gray-500">* Required fields</p>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>

        {/* Contact Info */}
        <div className="mt-8 text-center text-gray-600">
          <p>Questions about this position? Contact us at{' '}
            <a href="/contact" className="text-brand-blue-600 hover:underline">
              our contact form
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
