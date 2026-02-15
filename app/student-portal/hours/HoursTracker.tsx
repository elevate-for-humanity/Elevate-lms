'use client';

import { useEffect, useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  User,
  FileText
} from 'lucide-react';

type HourEntry = {
  id: string;
  hours: number;
  description: string | null;
  logged_date: string;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
};

type EnrollmentHours = {
  enrollment_id: string;
  program_name: string;
  program_slug: string;
  required_hours: number | null;
  entries: HourEntry[];
  verified_total: number;
  pending_total: number;
};

/**
 * Hours Tracker Component
 * Shows verified vs pending hours with audit trail.
 * Strict rendering: returns message if no hours logged.
 */
export default function HoursTracker() {
  const [enrollments, setEnrollments] = useState<EnrollmentHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHours() {
      try {
        const res = await fetch('/api/student/hours');
        if (!res.ok) {
          if (res.status === 401) {
            setEnrollments([]);
            return;
          }
          throw new Error('Failed to fetch hours');
        }
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchHours();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>Unable to load hours data. Please try again later.</p>
        </div>
      </div>
    );
  }

  // No enrollments = show helpful message
  if (enrollments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Hours Logged</h2>
        <p className="text-gray-600">
          You don&apos;t have any hours logged yet. Hours will appear here once you start logging time in your program.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {enrollments.map((enrollment) => {
        const progress = enrollment.required_hours 
          ? Math.min(100, (enrollment.verified_total / enrollment.required_hours) * 100)
          : 0;

        return (
          <div key={enrollment.enrollment_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{enrollment.program_name}</h2>
              {enrollment.required_hours && (
                <p className="text-sm text-gray-600 mt-1">
                  {enrollment.required_hours} hours required for completion
                </p>
              )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b border-gray-100">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Verified Hours</span>
                </div>
                <p className="text-3xl font-bold text-green-800">
                  {enrollment.verified_total.toFixed(1)}
                </p>
              </div>

              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-700 mb-1">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">Pending Verification</span>
                </div>
                <p className="text-3xl font-bold text-amber-800">
                  {enrollment.pending_total.toFixed(1)}
                </p>
              </div>

              {enrollment.required_hours && (
                <div className="bg-brand-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-brand-blue-700 mb-1">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">Progress</span>
                  </div>
                  <p className="text-3xl font-bold text-brand-blue-800">
                    {progress.toFixed(0)}%
                  </p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {enrollment.required_hours && (
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progress toward {enrollment.required_hours} hours</span>
                  <span>{enrollment.verified_total.toFixed(1)} / {enrollment.required_hours}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Hours Log */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hours Log</h3>
              
              {enrollment.entries.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hours logged yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Hours</th>
                        <th className="pb-3 font-medium">Description</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Verified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {enrollment.entries.map((entry) => (
                        <tr key={entry.id} className="text-sm">
                          <td className="py-3">
                            <div className="flex items-center gap-2 text-gray-900">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(entry.logged_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 font-medium text-gray-900">
                            {entry.hours.toFixed(1)}
                          </td>
                          <td className="py-3 text-gray-600 max-w-xs truncate">
                            {entry.description || '-'}
                          </td>
                          <td className="py-3">
                            {entry.verified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-gray-500 text-xs">
                            {entry.verified && entry.verified_at ? (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {new Date(entry.verified_at).toLocaleDateString()}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
