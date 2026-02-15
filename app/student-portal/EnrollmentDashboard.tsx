'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  ExternalLink, 
  ArrowRight, 
  AlertCircle,
  CheckCircle,
  Clock,
  GraduationCap,
  Building2
} from 'lucide-react';

type Enrollment = {
  source_table: string;
  enrollment_id: string;
  program_title: string | null;
  course_title: string | null;
  provider_name: string | null;
  status: string;
  progress: number;
  delivery_mode: 'internal' | 'partner' | 'hybrid';
  inferred_delivery_mode: boolean;
  continue_url: string;
  created_at: string;
};

export default function EnrollmentDashboard() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnrollments() {
      try {
        const res = await fetch('/api/enrollments/me');
        if (!res.ok) {
          if (res.status === 401) {
            setEnrollments([]);
            return;
          }
          throw new Error('Failed to fetch enrollments');
        }
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchEnrollments();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>Unable to load enrollments. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return null; // Don't show anything if no enrollments
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'active':
      case 'enrolled':
      case 'in_progress':
        return <Clock className="w-5 h-5 text-brand-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getDeliveryModeLabel = (mode: string) => {
    switch (mode) {
      case 'partner':
        return { label: 'Partner Course', icon: Building2, color: 'text-brand-blue-600 bg-brand-blue-50' };
      case 'hybrid':
        return { label: 'Apprenticeship', icon: GraduationCap, color: 'text-orange-600 bg-orange-50' };
      default:
        return { label: 'Online Course', icon: BookOpen, color: 'text-brand-blue-600 bg-brand-blue-50' };
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <GraduationCap className="w-6 h-6 text-brand-blue-600" />
        My Enrollments
      </h2>

      <div className="space-y-4">
        {enrollments.map((enrollment) => {
          const modeInfo = getDeliveryModeLabel(enrollment.delivery_mode);
          const ModeIcon = modeInfo.icon;

          return (
            <div
              key={enrollment.enrollment_id}
              className="border border-gray-200 rounded-lg p-4 hover:border-brand-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(enrollment.status)}
                    <h3 className="font-semibold text-gray-900">
                      {enrollment.program_title || enrollment.course_title || 'Untitled Program'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${modeInfo.color}`}>
                      <ModeIcon className="w-3 h-3" />
                      {modeInfo.label}
                    </span>

                    {enrollment.provider_name && (
                      <span className="text-xs text-gray-500">
                        via {enrollment.provider_name}
                      </span>
                    )}

                    <span className="text-xs text-gray-500 capitalize">
                      {enrollment.status}
                    </span>

                    {enrollment.inferred_delivery_mode && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-amber-600 bg-amber-50">
                        <AlertCircle className="w-3 h-3" />
                        Needs config
                      </span>
                    )}
                  </div>

                  {enrollment.progress > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{enrollment.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-blue-500 rounded-full transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href={enrollment.continue_url}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white text-sm font-medium rounded-lg hover:bg-brand-blue-700 transition-colors whitespace-nowrap"
                >
                  {enrollment.delivery_mode === 'partner' ? (
                    <>
                      View Details
                      <ExternalLink className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
