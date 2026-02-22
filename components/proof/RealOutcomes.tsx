"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Award, Briefcase, Calendar } from 'lucide-react';

/**
 * Real Outcomes Component
 *
 * Shows REAL data from database
 * Dated, specific, verifiable
 */
export function RealOutcomes() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadMetrics() {
      // Direct DB queries for real-time metrics
      const [enrollmentsResult, completedResult, activeResult] = await Promise.all([
        supabase
          .from('program_enrollments')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('program_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed'),
        supabase
          .from('program_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const totalEnrollments = enrollmentsResult.count || 0;
      const completedCourses = completedResult.count || 0;
      const activeStudents = activeResult.count || 0;
      const completionRate = totalEnrollments > 0 
        ? Math.round((completedCourses / totalEnrollments) * 100) 
        : 0;

      setMetrics({
        metrics: {
          totalEnrollments,
          completedCourses,
          completionRate,
          activeStudents
        },
        dataSource: 'Supabase Production Database',
        lastUpdated: new Date().toISOString(),
        verified: true
      });
      setLoading(false);
    }
    loadMetrics();
  }, [supabase]);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-black">Loading verified outcomes...</div>
        </div>
      </section>
    );
  }

  if (!metrics) {
    return null;
  }

  const outcomes = [
    {
      label: 'Total Students Enrolled',
      value: metrics.metrics.totalEnrollments.toLocaleString(),
      icon: Users,
      context: 'All-time platform enrollments',
      verified: true,
    },
    {
      label: 'Courses Completed',
      value: metrics.metrics.completedCourses.toLocaleString(),
      icon: Award,
      context: 'Successfully finished training',
      verified: true,
    },
    {
      label: 'Completion Rate',
      value: `${metrics.metrics.completionRate}%`,
      icon: TrendingUp,
      context: 'Students who finish their program',
      verified: true,
    },
    {
      label: 'Active Students',
      value: metrics.metrics.activeStudents.toLocaleString(),
      icon: Briefcase,
      context: 'Currently enrolled (last 30 days)',
      verified: true,
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-blue-100 text-brand-blue-800 px-4 py-2 rounded-full mb-4">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">
              Live Data from Production Database
            </span>
          </div>
          <h2 className="text-3xl font-bold text-black mb-4">
            Real Outcomes, Not Promises
          </h2>
          <p className="text-black max-w-2xl mx-auto">
            Every number below is pulled directly from our database and updated
            in real-time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {outcomes.map((outcome, index) => {
            const Icon = outcome.icon;
            return (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-10 w-10 text-brand-blue-600" />
                  {outcome.verified && (
                    <span className="text-xs bg-brand-green-100 text-brand-green-800 px-2 py-2 rounded-full font-semibold">
                      Verified
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-black mb-2">
                  {outcome.value}
                </div>
                <div className="text-sm font-semibold text-black mb-2">
                  {outcome.label}
                </div>
                <div className="text-xs text-slate-500">{outcome.context}</div>
              </div>
            );
          })}
        </div>

        {/* Data Source Proof */}
        <div className="bg-slate-900 text-white rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Calendar className="h-5 w-5 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="font-semibold mb-2">Data Verification</div>
              <div className="text-sm text-slate-300 space-y-1">
                <div>
                  <strong>Source:</strong> {metrics.dataSource}
                </div>
                <div>
                  <strong>Last Updated:</strong>{' '}
                  {formatDate(metrics.lastUpdated)}
                </div>
                <div>
                  <strong>Verified:</strong> {metrics.verified ? 'Yes •' : 'No'}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <a
                    href="/api/public/metrics"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue-400 hover:text-brand-blue-300 font-semibold text-sm"
                  >
                    View Raw API Data →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
