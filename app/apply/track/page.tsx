

'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { Search, Clock, XCircle, Phone, Mail, CheckCircle, } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'contacted';

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  program_id?: string;
  status: ApplicationStatus;
  submitted_at: string;
  notes?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Under Review',
    description: 'Your application is being reviewed by our team.',
  },
  contacted: {
    icon: Phone,
    color: 'text-brand-blue-600',
    bg: 'bg-brand-blue-50',
    border: 'border-brand-blue-200',
    label: 'Contacted',
    description:
      'An advisor has reached out to you. Please check your email or phone.',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-brand-green-600',
    bg: 'bg-brand-green-50',
    border: 'border-brand-green-200',
    label: 'Approved',
    description: 'Congratulations! Your application has been approved.',
  },
  rejected: {
    icon: XCircle,
    color: 'text-brand-orange-600',
    bg: 'bg-brand-red-50',
    border: 'border-brand-red-200',
    label: 'Not Approved',
    description:
      'Unfortunately, we cannot proceed with your application at this time.',
  },
};



export default function TrackApplicationPage() {
  const [searchId, setSearchId] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check URL params for pre-filled ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const email = params.get('email');

    if (id) {
      setSearchId(id);
      if (email) {
        setSearchEmail(email);
        // Auto-search if both provided
        handleSearch(id, email);
      }
    }
  }, []);

  const handleSearch = async (id?: string, email?: string) => {
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

      const response = await fetch(
        `/api/applications/track?${params.toString()}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            'Application not found. Please check your ID or email.'
          );
        }
        throw new Error('Failed to retrieve application status');
      }

      const data = await response.json();
      setApplication(data);
    } catch (err: any) {
      setError(
        'Operation failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const status = application ? statusConfig[application.status] : null;
  const StatusIcon = status?.icon;

  return (
    <div className="min-h-screen bg-zinc-900  via-white ">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Track' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">
            Track Your Application
          </h1>
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
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
              />
            </div>

            <div className="text-center text-sm text-slate-500 font-semibold">
              OR
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-black mb-2"
              >
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
                <h2 className={`text-2xl font-bold ${status.color} mb-2`}>
                  {status.label}
                </h2>
                <p className="text-black">{status.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-black mb-1">
                    Applicant Name
                  </p>
                  <p className="text-black font-medium">
                    {application.first_name} {application.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-black mb-1">
                    Email
                  </p>
                  <p className="text-black font-medium">
                    {application.email}
                  </p>
                </div>
              </div>

              {application.phone && (
                <div>
                  <p className="text-sm font-semibold text-black mb-1">
                    Phone
                  </p>
                  <p className="text-black font-medium">
                    {application.phone}
                  </p>
                </div>
              )}

              {application.program_id && (
                <div>
                  <p className="text-sm font-semibold text-black mb-1">
                    Program Interest
                  </p>
                  <p className="text-black font-medium">
                    {application.program_id}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-black mb-1">
                  Submitted
                </p>
                <p className="text-black font-medium">
                  {new Date(application.submitted_at).toLocaleDateString(
                    'en-US',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-black mb-1">
                  Application ID
                </p>
                <p className="text-black font-mono text-sm">
                  {application.id}
                </p>
              </div>

              {application.notes && (
                <div>
                  <p className="text-sm font-semibold text-black mb-1">
                    Notes
                  </p>
                  <p className="text-black">{application.notes}</p>
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="font-bold text-black mb-4">What's Next?</h3>

              {application.status === 'pending' && (
                <div className="space-y-3 text-sm text-black">
                  <p>
                    • An advisor will review your application within 24 hours
                  </p>
                  <p>• We'll contact you within 1-2 business days</p>
                  <p>• Check your email and phone for updates</p>
                </div>
              )}

              {application.status === 'contacted' && (
                <div className="space-y-3 text-sm text-black">
                  <p>• Please respond to our advisor's message</p>
                  <p>• Check your email inbox and spam folder</p>
                  <p>• Contact us if you haven't heard from us: Get Help Online</p>
                </div>
              )}

              {application.status === 'approved' && (
                <div className="space-y-3 text-sm text-black">
                  <p>• An advisor will contact you to complete enrollment</p>
                  <p>• We'll discuss funding options (WIOA, WRG, JRI)</p>
                  <p>• You'll receive program start date and details</p>
                </div>
              )}

              {application.status === 'rejected' && (
                <div className="space-y-3 text-sm text-black">
                  <p>• Contact us to discuss alternative options</p>
                  <p>• We may have other programs that fit your needs</p>
                  <p>• Contact us at Get Help Online for more information</p>
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
            <p className="text-sm text-black mb-3">
              Contact us Monday-Friday, 9am-5pm
            </p>
            <a
              href="/support"
              className="inline-block text-brand-orange-600 hover:text-brand-orange-700 font-semibold text-sm"
            >
              Get Help Online
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <Mail className="w-8 h-8 text-brand-orange-600 mb-3" />
            <h3 className="font-bold text-black mb-2">Email Us</h3>
            <p className="text-sm text-black mb-3">
              We respond within 24 hours
            </p>
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
          <Link
            href="/"
            className="text-black hover:text-black font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
