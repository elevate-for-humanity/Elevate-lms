
'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Clock, XCircle, FileText, ArrowRight } from 'lucide-react';

interface Application {
  id: string;
  status: string;
  program_id: string;
  submitted_at: string;
  first_name: string;
  notes: string;
}

export default function ApplicationStatusPage() {
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplication();
  }, []);

  const loadApplication = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?redirect=/lms/apply/status');
      return;
    }

    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('email', user.email)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    setApplication(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-11 w-11 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Application Found</h1>
          <p className="text-gray-600 mb-6">You haven't submitted an application yet.</p>
          <Link
            href="/lms/apply"
            className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
          >
            Start Application
          </Link>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: <span className="text-slate-400 flex-shrink-0">•</span>,
          title: 'Application Approved!',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          message: 'Congratulations! Your application has been approved. You can now proceed to enrollment.',
          showEnrollButton: true,
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-20 h-20 text-red-500" />,
          title: 'Application Not Approved',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          message: 'Unfortunately, your application was not approved at this time. Please contact us for more information.',
          showEnrollButton: false,
        };
      case 'contacted':
        return {
          icon: <Clock className="w-20 h-20 text-brand-blue-500" />,
          title: 'Under Review',
          bgColor: 'bg-brand-blue-50',
          borderColor: 'border-brand-blue-200',
          message: 'We\'ve reached out to you for additional information. Please check your email and phone.',
          showEnrollButton: false,
        };
      default:
        return {
          icon: <Clock className="w-20 h-20 text-yellow-500" />,
          title: 'Application Pending',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          message: 'Your application is being reviewed. We\'ll notify you within 2-3 business days.',
          showEnrollButton: false,
        };
    }
  };

  const config = getStatusConfig(application.status);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Lms", href: "/lms" }, { label: "Status" }]} />
      </div>
<div className={`rounded-lg border-2 p-8 ${config.bgColor} ${config.borderColor}`}>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            {config.icon}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {config.title}
          </h1>
          
          <p className="text-gray-700 text-lg mb-8">
            {config.message}
          </p>

          <div className="bg-white rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">Application Details</h2>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-gray-500 text-sm">Program</span>
                <p className="font-medium">{application.program_id || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Submitted</span>
                <p className="font-medium">
                  {new Date(application.submitted_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Application ID</span>
                <p className="font-medium text-xs">{application.id}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Status</span>
                <p className="font-medium capitalize">{application.status}</p>
              </div>
            </div>
          </div>

          {config.showEnrollButton && (
            <Link
              href="/lms/enroll"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700"
            >
              Proceed to Enrollment
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}

          {application.status === 'pending' && (
            <div className="mt-8 p-4 bg-white rounded-lg">
              <h3 className="font-semibold mb-2">While you wait:</h3>
              <ul className="text-left text-gray-600 space-y-1">
                <li>• Complete your student profile</li>
                <li>• Explore available courses</li>
                <li>• Prepare any required documents</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Questions? Contact us at{' '}
          <a href="/support" className="text-emerald-600 font-medium">
            support center
          </a>
        </p>
      </div>
    </div>
  );
}
