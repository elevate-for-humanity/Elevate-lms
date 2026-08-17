'use client';

import React from 'react';

import { useState, useEffect, useCallback } from 'react';
import { Search, Clock, XCircle, Phone, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'pending'
  | 'pending_funding'
  | 'pending_admin_review'
  | 'contacted'
  | 'approved'
  | 'enrolled'
  | 'rejected'
  | 'withdrawn';

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  program_interest?: string;
  program_id?: string;
  reference_number?: string;
  status: ApplicationStatus | string;
  submitted_at: string;
  support_notes?: string;
  notes?: string;
}

const pendingStatus = {
  icon: Clock,
  color: 'text-yellow-600',
  bg: 'bg-yellow-50',
  border: 'border-yellow-200',
  label: 'Under Review',
  description: 'Your application has been received and is being reviewed by our team.',
};

const statusConfig: Record<
  string,
  {
    icon: typeof Clock;
    color: string;
    bg: string;
    border: string;
    label: string;
    description: string;
  }
> = {
  submitted: pendingStatus,
  under_review: pendingStatus,
  pending: pendingStatus,
  pending_admin_review: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Pending Enrollment Review',
    description: 'Your application is awaiting final enrollment and funding review.',
  },
  pending_funding: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Funding Action Required',
    description: 'Your application is on hold while required funding steps are completed.',
  },
  contacted: {
    icon: Phone,
    color: 'text-brand-blue-600',
    bg: 'bg-brand-blue-50',
    border: 'border-brand-blue-200',
    label: 'Contacted',
    description: 'An advisor has reached out to you. Please check your email or phone.',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-brand-green-600',
    bg: 'bg-brand-green-50',
    border: 'border-brand-green-200',
    label: 'Approved',
    description: 'Congratulations! Your application has been approved.',
  },
  enrolled: {
    icon: CheckCircle,
    color: 'text-brand-green-600',
    bg: 'bg-brand-green-50',
    border: 'border-brand-green-200',
    label: 'Enrolled',
    description: 'Your enrollment is active. Use your student account to continue onboarding and training.',
  },
  rejected: {
    icon: XCircle,
    color: 'text-brand-orange-600',
    bg: 'bg-brand-red-50',
    border: 'border-brand-red-200',
    label: 'Not Approved',
    description: 'Unfortunately, we cannot proceed with your application at this time.',
  },
  withdrawn: {
    icon: XCircle,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: 'Withdrawn',
    description: 'This application has been withdrawn and is no longer active.',
  },
};

const unknownStatus = {
  icon: Clock,
  color: 'text-slate-600',
  bg: 'bg-slate-50',
  border: 'border-slate-200',
  label: 'Status Update',
  description: 'Your application has a status update. Contact admissions if you need clarification.',
};

export default function TrackApplicationPage() {
  const [searchId, setSearchId] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async (id?: string, email?: string) => {
    const applicationId = id || searchId;
    const applicationEmail = email || searchEmail;

    if (!applicationId && !applicationEmail) {
      setError('Please enter an Application ID or Email Address');
      return;
    }

    setLoading(true);
    setError('');
    setApplication(null);

    try {
      const params = new URLSearchParams();
      if (applicationId) params.append('id', applicationId);
      if (applicationEmail) params.append('email', applicationEmail);

      const response = await fetch(`/api/applications/track?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('We could not verify those details. Please confirm and try again.');
        }
        throw new Error('Failed to retrieve application status');
      }

      const data = await response.json();
      setApplication(data.application ?? data);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve application status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchId, searchEmail]);

  // Pre-fill and auto-search when URL params are present (e.g. link from confirmation email)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const email = params.get('email');
    if (id) setSearchId(id);
    if (email) setSearchEmail(email);
    if (id && email) handleSearch(id, email);
  }, [handleSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const status = application ? statusConfig[application.status] ?? unknownStatus : null;
  const StatusIcon = status?.icon;

  return (
    <div className="min-h-screen bg-white  via-white ">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Track' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Track Your Application</h1>
          <p className="text-lg text-black">
            Enter your Application ID or Email Address to check your status
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="applicationId"
                className="block text-sm font-semibold text-black mb-2"
              >
                Application ID (Optional)
              </label>
              <input
                type="text"
                id="applicationId"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
                placeholder="e.g., EFH-ABC123 or UUID"
              />
            </div>

            <div className="text-center text-sm text-black font-semibold">OR</div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-black mb-2">
                Email Address (Optional)
              </label>
              <input
                type="email"
                id="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
                placeholder="your.email@address.com"
              />
            </div>

            {error && (
              <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg">
                <p className="text-sm text-brand-orange-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-brand-orange-600 text-white font-bold rounded-lg hover:bg-brand-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Track Application
                </>
              )}
            </button>
          </form>
        </div>

        {/* Application Status */}
        {application && status && StatusIcon && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div
              className={`flex items-start gap-4 p-6 ${status.bg} ${status.border} border rounded-xl mb-6`}
            >
              <StatusIcon className={`w-8 h-8 ${status.color} flex-shrink-0`} />
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${status.color} mb-2`}>{status.label}</h2>
                <p className="text-black">{status.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-black mb-1">Applicant Name</p>
                  <p className="text-black font-medium">
                    {application.first_name} {application.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-black mb-1">Email</p>
                  <p className="text-black font-medium">{application.email}</p>
                </div>
              </div>

              {application.phone && (
                <div>
                  <p className="text-sm font-semibold text-black mb-1">Phone</p>
                  <p className="text-black font-medium">{application.phone}</p>
                </div>
              )}

              {(application.program_interest || application.program_id) && (
                <div>
                  <p className="text-sm font-semibold text-black mb-1">Program Interest</p>
                  <p className="text-black font-medium">
                    {application.program_interest || application.program_id}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-black mb-1">Submitted</p>
                <p className="text-black font-medium">
                  {new Date(application.submitted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {application.reference_number && (
                <div>
                  <p className="text-sm font-semibold text-black mb-1">Reference Number</p>
                  <p className="text-black font-mono font-bold">{application.reference_number}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-black mb-1">Application ID</p>
                <p className="text-black font-mono text-sm">{application.id}</p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="font-bold text-black mb-4">What's Next?</h3>

              {['submitted', 'under_review', 'pending'].includes(application.status) && (
                <div className="space-y-3 text-sm text-black">
                  <p>• An advisor will review your application</p>
                  <p>• We'll contact you with the next required enrollment step</p>
                  <p>• Check your email and phone for updates</p>
                </div>
              )}

              {application.status === 'pending_admin_review' && (
                <div className="space-y-3 text-sm text-black">
                  <p>• Your application is in final enrollment review</p>
                  <p>• Funding or payment authorization may be verified before activation</p>
                  <p>• We'll contact you when your enrollment decision is ready</p>
                </div>
              )}

              {application.status === 'pending_funding' && (
                <div className="space-y-3 text-sm text-black">
                  <p>• Complete the funding or WorkOne steps provided by your advisor</p>
                  <p>• Enrollment cannot activate until required funding authorization is verified</p>
                  <p>• Contact admissions if you need help completing the funding process</p>
                </div>
              )}

              {application.status === 'contacted' && (
                <div className="space-y-3 text-sm text-black">
                  <p>• Please respond to our advisor's message</p>
                  <p>• Check your email inbox and spam folder</p>
                  <p>• Contact us if you haven't heard from us: {PLATFORM_DEFAULTS.supportPhone}</p>
                </div>
              )}

              {application.status === 'approved' && (
                <div className="space-y-3 text-sm text-black">
                  <p>• Complete any remaining enrollment and onboarding requirements</p>
                  <p>• Verify your funding or payment authorization if requested</p>
                  <p>• Use your student account for the next onboarding step</p>
                </div>
              )}

              {application.status === 'enrolled' && (
                <div className="space-y-3 text-sm text-black">
                  <p>• Your enrollment is active</p>
                  <p>• Sign in to your student account and complete onboarding</p>
                  <p>• Open your assigned course from the LMS when access is available</p>
                </div>
              )}

              {application.status === 'rejected' && (
                <div className="space-y-3 text-sm text-black">
                  <p>• Contact us to discuss alternative options</p>
                  <p>• We may have other programs that fit your needs</p>
                  <p>• Contact us at {PLATFORM_DEFAULTS.supportPhone} for more information</p>
                </div>
              )}

              {application.status === 'withdrawn' && (
                <div className="space-y-3 text-sm text-black">
                  <p>• This application is no longer active</p>
                  <p>• Contact admissions if you believe it was withdrawn in error</p>
                  <p>• You may submit a new application when appropriate</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Phone className="w-8 h-8 text-brand-orange-600 mb-3" />
            <h3 className="font-bold text-black mb-2">Need Help?</h3>
            <p className="text-sm text-black mb-3">Contact us Monday-Friday, 9am-5pm</p>
            <a
              href="/support"
              className="inline-block text-brand-orange-600 hover:text-brand-orange-700 font-semibold text-sm"
            >
              {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <Mail className="w-8 h-8 text-brand-orange-600 mb-3" />
            <h3 className="font-bold text-black mb-2">Email Us</h3>
            <p className="text-sm text-black mb-3">We respond within 24 hours</p>
            <a
              href="/contact"
              className="inline-block text-brand-orange-600 hover:text-brand-orange-700 font-semibold text-sm"
            >
              our contact form
            </a>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-black hover:text-black font-semibold">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
