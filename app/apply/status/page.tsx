'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Circle, Clock, XCircle, Phone, Loader2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface ApplicationStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'contacted';
  program_id: string;
  submitted_at: string;
  first_name: string;
}



export default function ApplicationStatusPage() {
  const [email, setEmail] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [application, setApplication] = useState<ApplicationStatus | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setApplication(null);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      params.append('email', email);
      if (applicationId) params.append('id', applicationId);

      const response = await fetch(`/api/applications/track?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.application) {
        setApplication(data.application);
      } else {
        setError(data.error || 'Application not found. Please check your Application ID and email.');
      }
    } catch (error) {
      setError('Failed to check status. Please try again or call 317-314-3757.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: <Circle className="w-12 h-12 text-brand-green-500" />,
          title: 'Approved!',
          color: 'bg-brand-green-50 border-brand-green-200',
          textColor: 'text-brand-green-800',
          message: 'Congratulations! Your application has been approved. Check your email for next steps.',
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-12 h-12 text-brand-red-500" />,
          title: 'Not Approved',
          color: 'bg-brand-red-50 border-brand-red-200',
          textColor: 'text-brand-red-800',
          message: 'Unfortunately, your application was not approved at this time. Please contact us for more information.',
        };
      case 'contacted':
        return {
          icon: <Phone className="w-12 h-12 text-brand-blue-500" />,
          title: 'In Review',
          color: 'bg-brand-blue-50 border-brand-blue-200',
          textColor: 'text-brand-blue-800',
          message: 'We\'ve reached out to you. Please check your email and phone for messages from our team.',
        };
      default:
        return {
          icon: <Clock className="w-12 h-12 text-yellow-500" />,
          title: 'Pending Review',
          color: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          message: 'Your application is being reviewed. We\'ll contact you within 2-3 business days.',
        };
    }
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <Breadcrumbs
        items={[
          { label: 'Apply', href: '/apply' },
          { label: 'Status' },
        ]}
      />
      <div className="max-w-xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Check Application Status</h1>
          <p className="text-black">Enter your Application ID and email from your confirmation to check status</p>
        </div>

        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="space-y-3">
            <input
              type="text"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="Application ID (from your confirmation email)"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking</>
                  : <><Search className="w-4 h-4" /> Check</>}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6">
            <p className="text-brand-red-800">{error}</p>
          </div>
        )}

        {application && (
          <div className={`rounded-lg border-2 p-6 ${getStatusDisplay(application.status).color}`}>
            <div className="flex flex-col items-center text-center">
              {getStatusDisplay(application.status).icon}
              <h2 className={`text-2xl font-bold mt-4 ${getStatusDisplay(application.status).textColor}`}>
                {getStatusDisplay(application.status).title}
              </h2>
              <p className="text-slate-700 mt-2">
                {getStatusDisplay(application.status).message}
              </p>
              
              <div className="mt-6 w-full bg-white rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-black">Program</span>
                    <p className="font-medium">{application.program_id || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-black">Submitted</span>
                    <p className="font-medium">
                      {new Date(application.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {application.status === 'approved' && (
                <Link
                  href="/learner/dashboard"
                  className="mt-6 inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
                >
                  Go to Student Dashboard
                </Link>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-lg border p-8 mb-6 animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
            <div className="h-10 bg-slate-100 rounded" />
          </div>
        )}

        {searched && !loading && !application && !error && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-slate-700 font-medium mb-1">No application found</p>
            <p className="text-slate-500 text-sm mb-4">
              Double-check the Application ID from your confirmation email and the email address you applied with.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center text-sm">
              <a href="tel:3173143757" className="text-emerald-600 font-medium hover:underline">
                Call (317) 314-3757
              </a>
              <Link href="/apply" className="text-emerald-600 font-medium hover:underline">
                Submit a new application
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-black">
          <p>Need help? Contact us at <a href="tel:317-314-3757" className="text-emerald-600 font-medium">317-314-3757</a></p>
          <p className="mt-2">
            <Link href="/start" className="text-emerald-600 hover:underline">Submit a new application</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
