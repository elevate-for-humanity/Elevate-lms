import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { 
  ArrowLeft, 
  ExternalLink, 
  Mail, 
  Clock, 
  AlertCircle, Circle,
  Building2,
  BookOpen,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Learning | Elevate For Humanity',
  description: 'Access your partner course enrollment details and instructions.',
};

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ enrollmentId: string }>;
};

export default async function PartnerLearningPage({ params }: Props) {
  const { enrollmentId } = await params;
  
  const supabase = await createClient();
  

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/partner-learning/' + enrollmentId);
  }

  // Fetch the partner enrollment
  const { data: enrollment, error } = await supabase
    .from('partner_lms_enrollments')
    .select(`
      *,
      partner_lms_courses (id, title, slug, description),
      partner_lms_providers (id, name, portal_url, support_email, support_phone)
    `)
    .eq('id', enrollmentId)
    .eq('student_id', user.id)
    .single();

  if (error || !enrollment) {
    notFound();
  }

  const course = enrollment.partner_lms_courses as any;
  const provider = enrollment.partner_lms_providers as any;

  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { icon: Circle, color: 'text-brand-green-600 bg-brand-green-50', label: 'Completed' };
      case 'active':
      case 'enrolled':
      case 'in_progress':
        return { icon: Clock, color: 'text-brand-blue-600 bg-brand-blue-50', label: 'In Progress' };
      case 'pending':
        return { icon: AlertCircle, Circle, color: 'text-amber-600 bg-amber-50', label: 'Pending Setup' };
      default:
        return { icon: Clock, color: 'text-gray-600 bg-white', label: status || 'Unknown' };
    }
  };

  const statusInfo = getStatusInfo(enrollment.status);
  const StatusIcon = statusInfo.icon;

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link 
            href="/student-portal" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Student Portal
          </Link>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-brand-blue-600 text-sm font-medium mb-2">
                <Building2 className="w-4 h-4" />
                Partner Course
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {course?.title || enrollment.course_name || 'Partner Course'}
              </h1>
              {provider?.name && (
                <p className="text-gray-600 mt-1">Provided by {provider.name}</p>
              )}
            </div>
            
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Instructions Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-blue-50 rounded-lg">
              <Mail className="w-6 h-6 text-brand-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                How to Access Your Course
              </h2>
              <div className="text-gray-600 space-y-2">
                <p>
                  You will receive login credentials for the partner learning portal via email. 
                  Please check your inbox (and spam folder) for instructions from {provider?.name || 'the course provider'}.
                </p>
                <p>
                  Once you receive your credentials, use the partner portal to complete your training. 
                  Your progress will be tracked and reported back to Elevate for Humanity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Portal Access */}
        {provider?.portal_url && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Partner Portal</h2>
            <a
              href={provider.portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Open Partner Portal
              <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-sm text-gray-500 mt-3">
              Opens in a new tab. You'll need your partner login credentials.
            </p>
          </div>
        )}

        {/* Course Details */}
        {course?.description && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About This Course</h2>
            <p className="text-gray-600">{course.description}</p>
          </div>
        )}

        {/* Support Contact */}
        {(provider?.support_email || provider?.support_phone) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
            <div className="space-y-3">
              {provider.support_email && (
                <a 
                  href={`mailto:${provider.support_email}`}
                  className="flex items-center gap-3 text-gray-600 hover:text-brand-blue-600"
                >
                  <Mail className="w-5 h-5" />
                  {provider.support_email}
                </a>
              )}
              {provider.support_phone && (
                <a 
                  href={`tel:${provider.support_phone}`}
                  className="flex items-center gap-3 text-gray-600 hover:text-brand-blue-600"
                >
                  <BookOpen className="w-5 h-5" />
                  {provider.support_phone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Elevate Support */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Having trouble? Contact Elevate for Humanity support at{' '}
            <a href="/support" className="text-brand-blue-600 hover:underline">
              support center
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
