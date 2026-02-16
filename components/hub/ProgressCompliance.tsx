'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  
  Clock, 
  AlertTriangle, 
  FileCheck,
  TrendingUp,
  Calendar,
CheckCircle, } from 'lucide-react';

interface ProgressData {
  totalHours: number;
  requiredHours: number;
  completedModules: number;
  totalModules: number;
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
  lastActivity: string;
  upcomingDeadlines: Array<{
    title: string;
    date: string;
    type: string;
  }>;
}

export default function ProgressCompliance({ userId }: { userId?: string }) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      const supabase = createClient();
      
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id;
      }

      if (!targetUserId) {
        setLoading(false);
        return;
      }

      // Fetch enrollment progress
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id, progress, status, programs(required_hours)')
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .single();

      // Fetch completed lessons/modules
      const { data: completedLessons, count: completedCount } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact' })
        .eq('user_id', targetUserId)
        .eq('completed', true);

      // Fetch total lessons for enrolled courses
      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });

      // Fetch hour logs
      const { data: hourLogs } = await supabase
        .from('hour_logs')
        .select('hours')
        .eq('user_id', targetUserId)
        .eq('status', 'approved');

      const totalHours = hourLogs?.reduce((sum, log) => sum + (log.hours || 0), 0) || 0;
      const requiredHours = (enrollments?.programs as any)?.required_hours || 0;

      // Determine compliance status
      let complianceStatus: 'compliant' | 'at_risk' | 'non_compliant' = 'compliant';
      const progressPercent = requiredHours > 0 ? (totalHours / requiredHours) * 100 : 0;
      if (progressPercent < 25) complianceStatus = 'at_risk';
      if (progressPercent < 10) complianceStatus = 'non_compliant';

      setData({
        totalHours,
        requiredHours,
        completedModules: completedCount || 0,
        totalModules: totalLessons || 0,
        complianceStatus,
        lastActivity: new Date().toISOString(),
        upcomingDeadlines: [],
      });

      setLoading(false);
    }

    fetchProgress();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 mb-2">No Progress Data</h3>
        <p className="text-slate-600">Enroll in a program to track your progress</p>
      </div>
    );
  }

  const statusConfig = {
    compliant: { label: 'On Track', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
    at_risk: { label: 'At Risk', color: 'text-amber-700', bg: 'bg-amber-100', icon: AlertTriangle },
    non_compliant: { label: 'Behind', color: 'text-red-700', bg: 'bg-red-100', icon: AlertTriangle },
  };

  const status = statusConfig[data.complianceStatus];
  const StatusIcon = status.icon;
  const hoursPercent = data.requiredHours > 0 ? Math.min((data.totalHours / data.requiredHours) * 100, 100) : 0;
  const modulesPercent = data.totalModules > 0 ? Math.min((data.completedModules / data.totalModules) * 100, 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      {/* Compliance Status */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Progress & Compliance</h3>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${status.bg} ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{status.label}</span>
        </div>
      </div>

      {/* Hours Progress */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600">Hours Completed</span>
          <span className="font-medium text-slate-900">{data.totalHours} / {data.requiredHours} hrs</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${hoursPercent}%` }}
          />
        </div>
      </div>

      {/* Modules Progress */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600">Modules Completed</span>
          <span className="font-medium text-slate-900">{data.completedModules} / {data.totalModules}</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${modulesPercent}%` }}
          />
        </div>
      </div>

      {/* Compliance Note */}
      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
        <FileCheck className="w-4 h-4 inline mr-2 text-slate-400" />
        All progress is automatically logged for compliance reporting.
      </div>
    </div>
  );
}
