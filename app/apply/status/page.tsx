'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Circle, Clock, XCircle, Phone } from 'lucide-react';
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
          icon: <Circle className="w-12 h-12 text-green-500" />,
          title: 'Approved!',
          color: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          message: 'Congratulations! Your application has been approved. Check your email for next steps.',
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-12 h-12 text-red-500" />,
          title: 'Not Approved',
          color: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          message: 'Unfortunately, your application was not approved at this time. Please contact us for more information.',
        };
      case 'contacted':
        return {
          icon: <Phone className="w-12 h-12 text-blue-500" />,
          title: 'In Review',
          color: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
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
    <div className="min-h-screen bg-gray-50 py-12">
      <Breadcrumbs
        items={[
          { label: 'Apply', href: '/apply' },
          { label: 'Status' },
        ]}
      />
      <div className="max-w-xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Application Status</h1>
          <p className="text-gray-600">Enter your Application ID and email from your confirmation to check status</p>
        </div>

        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="space-y-3">
            <input
              type="text"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="Application ID (from your confirmation email)"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                {loading ? 'Checking...' : 'Check'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {application && (
          <div className={`rounded-lg border-2 p-6 ${getStatusDisplay(application.status).color}`}>
            <div className="flex flex-col items-center text-center">
              {getStatusDisplay(application.status).icon}
              <h2 className={`text-2xl font-bold mt-4 ${getStatusDisplay(application.status).textColor}`}>
                {getStatusDisplay(application.status).title}
              </h2>
              <p className="text-gray-700 mt-2">
                {getStatusDisplay(application.status).message}
              </p>
              
              <div className="mt-6 w-full bg-white rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Program</span>
                    <p className="font-medium">{application.program_id || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Submitted</span>
                    <p className="font-medium">
                      {new Date(application.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {application.status === 'approved' && (
                <Link
                  href="/lms/dashboard"
                  className="mt-6 inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
                >
                  Go to Student Dashboard
                </Link>
              )}
            </div>
          </div>
        )}

        {searched && !application && !error && (
          <div className="bg-gray-100 rounded-lg p-6 text-center">
            <p className="text-gray-600">No application found. Did you use a different email?</p>
          </div>
        )}

        <div className="mt-8 text-center text-gray-600">
          <p>Need help? Contact us at <a href="tel:317-314-3757" className="text-emerald-600 font-medium">317-314-3757</a></p>
          <p className="mt-2">
            <Link href="/apply" className="text-emerald-600 hover:underline">Submit a new application</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
