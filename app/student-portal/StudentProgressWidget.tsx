'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  
  AlertCircle,
  TrendingUp,
  FileText,
  ArrowRight
} from 'lucide-react';

type DashboardData = {
  enrollments: Array<{
    id: string;
    status: string;
    program: {
      name: string;
      slug: string;
      required_hours: number | null;
    } | null;
    hours: {
      verified: number;
      pending: number;
    };
    tasks: Array<{
      id: string;
      status: string;
      task: {
        title: string;
      } | null;
    }>;
  }>;
  totalVerifiedHours: number;
  totalPendingHours: number;
  totalTasks: number;
  completedTasks: number;
};

/**
 * Student Progress Widget
 * Shows verified hours, pending hours, and task completion.
 * Strict rendering: returns null if no data.
 */
export default function StudentProgressWidget() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/student/dashboard');
        if (!res.ok) {
          if (res.status === 401) {
            setData(null);
            return;
          }
          throw new Error('Failed to fetch dashboard');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>Unable to load progress data.</p>
        </div>
      </div>
    );
  }

  // Strict rendering: no data = no widget
  if (!data || data.enrollments.length === 0) {
    return null;
  }

  const hasHours = data.totalVerifiedHours > 0 || data.totalPendingHours > 0;
  const hasTasks = data.totalTasks > 0;

  // If no hours and no tasks, don't show the widget
  if (!hasHours && !hasTasks) {
    return null;
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-green-600" />
        My Progress
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Verified Hours */}
        {hasHours && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span className="text-sm font-medium">Verified Hours</span>
            </div>
            <p className="text-3xl font-bold text-green-800">
              {data.totalVerifiedHours.toFixed(1)}
            </p>
          </div>
        )}

        {/* Pending Hours */}
        {data.totalPendingHours > 0 && (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Pending Verification</span>
            </div>
            <p className="text-3xl font-bold text-amber-800">
              {data.totalPendingHours.toFixed(1)}
            </p>
          </div>
        )}

        {/* Tasks */}
        {hasTasks && (
          <div className="bg-brand-blue-50 rounded-lg p-4 border border-brand-blue-100">
            <div className="flex items-center gap-2 text-brand-blue-700 mb-1">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">Tasks Completed</span>
            </div>
            <p className="text-3xl font-bold text-brand-blue-800">
              {data.completedTasks} / {data.totalTasks}
            </p>
          </div>
        )}
      </div>

      {/* Per-enrollment breakdown */}
      {data.enrollments.filter(e => e.program).map((enrollment) => {
        const program = enrollment.program!;
        const progress = program.required_hours 
          ? Math.min(100, (enrollment.hours.verified / program.required_hours) * 100)
          : 0;

        return (
          <div key={enrollment.id} className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{program.name}</h3>
              {program.required_hours && (
                <span className="text-sm text-gray-500">
                  {enrollment.hours.verified} / {program.required_hours} hours
                </span>
              )}
            </div>
            
            {program.required_hours && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {enrollment.tasks.length > 0 && (
              <div className="text-sm text-gray-600">
                {enrollment.tasks.filter(t => t.status === 'approved').length} of {enrollment.tasks.length} tasks completed
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-6 pt-4 border-t border-gray-100">
        <Link
          href="/student-portal/hours"
          className="inline-flex items-center gap-2 text-brand-blue-600 font-medium hover:text-brand-blue-700"
        >
          View Full Progress Report
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
