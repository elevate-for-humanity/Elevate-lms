"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { Clock, Award, BookOpen, Briefcase } from 'lucide-react';
import Link from 'next/link';

interface HourSummary {
  total_rti_hours: number;
  total_ojl_hours: number;
  total_hours: number;
  approved_hours: number;
  pending_hours: number;
  transfer_hours: number;
  required_hours: number;
  remaining_hours: number;
  progress_percentage: number;
  wioa_rti_hours: number;
  wioa_ojl_hours: number;
  rapids_status: string;
  rapids_id: string | null;
  lms_enrolled: boolean;
  lms_completed: boolean;
  ready_for_exam: boolean;
  practical_skills_verified: boolean;
}

interface ApprenticeProgressWidgetProps {
  enrollmentId?: string;
  studentId?: string;
  programName?: string;
}

export function ApprenticeProgressWidget({ 
  enrollmentId, 
  studentId,
  programName = 'Barber Apprenticeship'
}: ApprenticeProgressWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<HourSummary>({
    total_rti_hours: 0,
    total_ojl_hours: 0,
    total_hours: 0,
    approved_hours: 0,
    pending_hours: 0,
    transfer_hours: 0,
    required_hours: 0,
    remaining_hours: 0,
    progress_percentage: 0,
    wioa_rti_hours: 0,
    wioa_ojl_hours: 0,
    rapids_status: 'pending',
    rapids_id: null,
    lms_enrolled: false,
    lms_completed: false,
    ready_for_exam: false,
    practical_skills_verified: false,
  });

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (enrollmentId) params.set('enrollment_id', enrollmentId);
        
        const res = await fetch(`/api/apprentice/hours-summary?${params.toString()}`, {
          cache: 'no-store',
        });
        
        if (!res.ok) {
          throw new Error('Failed to load hour summary');
        }
        
        const data = await res.json();
        setSummary(data.summary || data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load progress');
        // Use default values on error
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [enrollmentId]);

  const effectiveTotal = summary.total_hours + summary.transfer_hours;
  const progressPercentage = summary.progress_percentage || Math.min((effectiveTotal / summary.required_hours) * 100, 100);
  const hoursRemaining = summary.remaining_hours || Math.max(summary.required_hours - effectiveTotal, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
        <div className="h-20 bg-slate-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-brand-blue-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Apprenticeship Progress</h3>
            <p className="text-purple-100 text-sm">{programName}</p>
          </div>
          <Clock className="w-8 h-8 opacity-80" />
        </div>
      </div>

      {/* Main Progress */}
      <div className="p-4 space-y-4">
        {/* Total Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Total Progress</span>
            <span className="text-lg font-bold text-purple-600">
              {effectiveTotal.toFixed(1)} / {summary.required_hours} hrs
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-brand-blue-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
            <span>{progressPercentage.toFixed(1)}% Complete</span>
            <span>{hoursRemaining.toFixed(1)} hours remaining</span>
          </div>
        </div>

        {/* Hour Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {/* RTI Hours (Theory/LMS) */}
          <div className="bg-brand-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-brand-blue-600" />
              <span className="text-xs font-semibold text-brand-blue-800">RTI (Theory)</span>
            </div>
            <div className="text-xl font-bold text-brand-blue-600">
              {summary.total_rti_hours.toFixed(1)}
            </div>
            <div className="text-xs text-brand-blue-600">Elevate LMS coursework</div>
          </div>

          {/* OJL Hours (On-the-Job Learning) */}
          <div className="bg-brand-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-brand-green-600" />
              <span className="text-xs font-semibold text-brand-green-800">OJL (Hands-on)</span>
            </div>
            <div className="text-xl font-bold text-brand-green-600">
              {summary.total_ojl_hours.toFixed(1)}
            </div>
            <div className="text-xs text-brand-green-600">Shop training</div>
          </div>
        </div>

        {/* Transfer Hours (if any) */}
        {summary.transfer_hours > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">Transfer Hours</span>
              </div>
              <span className="text-lg font-bold text-amber-600">
                {summary.transfer_hours.toFixed(1)} hrs
              </span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Prior experience credited toward your requirement
            </p>
          </div>
        )}

        {/* Status Breakdown */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="text-slate-600">Approved: {summary.approved_hours.toFixed(1)}h</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="text-slate-600">Pending: {summary.pending_hours.toFixed(1)}h</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Link
            href="/apprentice/hours"
            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Clock className="w-4 h-4" />
            Log Hours
          </Link>
          <a
            href="/lms/courses"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Elevate LMS
          </a>
        </div>

        {/* RAPIDS & LMS Status */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
          <div className="text-center p-2">
            <div className={`text-xs font-semibold ${
              summary.rapids_status === 'registered' || summary.rapids_status === 'active' 
                ? 'text-brand-green-600' 
                : 'text-amber-600'
            }`}>
              RAPIDS: {summary.rapids_status?.toUpperCase() || 'PENDING'}
            </div>
            {summary.rapids_id && (
              <div className="text-xs text-slate-500">ID: {summary.rapids_id}</div>
            )}
          </div>
          <div className="text-center p-2">
            <div className={`text-xs font-semibold ${
              summary.lms_completed 
                ? 'text-brand-green-600' 
                : summary.lms_enrolled 
                  ? 'text-brand-blue-600' 
                  : 'text-amber-600'
            }`}>
              LMS: {summary.lms_completed ? 'COMPLETE' : summary.lms_enrolled ? 'IN PROGRESS' : 'NOT STARTED'}
            </div>
          </div>
        </div>

        {/* State Board Readiness */}
        {summary.ready_for_exam ? (
          <div className="bg-gradient-to-r from-brand-green-500 to-emerald-500 rounded-lg p-4 text-center text-white">
            <Award className="w-8 h-8 mx-auto mb-2" />
            <div className="font-bold">Ready for State Board!</div>
            <div className="text-sm text-white">
              Schedule your Indiana IPLA exam
            </div>
          </div>
        ) : progressPercentage >= 100 ? (
          <div className="bg-gradient-to-r from-amber-500 to-brand-orange-500 rounded-lg p-4 text-center text-white">
            <Award className="w-8 h-8 mx-auto mb-2" />
            <div className="font-bold">Hours Complete!</div>
            <div className="text-sm text-amber-100">
              Complete LMS theory to unlock state board exam
            </div>
          </div>
        ) : null}

        {/* Transfer Hours Link */}
        {summary.transfer_hours === 0 && (
          <div className="text-center pt-2">
            <Link
              href="/apprentice/transfer-hours"
              className="text-sm text-purple-600 hover:text-purple-700 underline"
            >
              Have prior training? Request transfer hours →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApprenticeProgressWidget;
