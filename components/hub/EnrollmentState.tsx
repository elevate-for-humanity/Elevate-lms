'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  
  Clock, 
  AlertTriangle, 
  ArrowRight,
  BookOpen,
  Award,
  Briefcase,
  FileCheck,
CheckCircle, } from 'lucide-react';

type EnrollmentStatus = 'applied' | 'enrolled' | 'in_progress' | 'at_risk' | 'completed' | 'graduated';

interface EnrollmentData {
  id: string;
  status: EnrollmentStatus;
  program_name: string;
  program_id: string;
  progress_percent: number;
  enrolled_at: string;
  next_action: string;
  next_action_url: string;
  days_inactive?: number;
}

const statusConfig: Record<EnrollmentStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: any;
}> = {
  applied: { 
    label: 'Application Pending', 
    color: 'text-brand-blue-700', 
    bgColor: 'bg-brand-blue-100',
    icon: Clock 
  },
  enrolled: { 
    label: 'Enrolled', 
    color: 'text-brand-green-700', 
    bgColor: 'bg-brand-green-100',
    icon: CheckCircle 
  },
  in_progress: { 
    label: 'In Progress', 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-100',
    icon: BookOpen 
  },
  at_risk: { 
    label: 'At Risk', 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-100',
    icon: AlertTriangle 
  },
  completed: { 
    label: 'Completed', 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100',
    icon: Award 
  },
  graduated: { 
    label: 'Graduated', 
    color: 'text-indigo-700', 
    bgColor: 'bg-indigo-100',
    icon: Briefcase 
  },
};

function determineNextAction(enrollment: any): { action: string; url: string } {
  const progress = enrollment.progress_percent || 0;
  const status = enrollment.status;

  if (status === 'applied') {
    return { action: 'Complete onboarding', url: '/onboarding' };
  }
  if (progress === 0) {
    return { action: 'Start your first course', url: '/hub/classroom' };
  }
  if (progress < 100) {
    return { action: 'Continue learning', url: '/hub/classroom' };
  }
  if (status === 'completed') {
    return { action: 'View your certificate', url: '/certificates' };
  }
  return { action: 'Explore career services', url: '/career-services' };
}

export default function EnrollmentState({ userId }: { userId?: string }) {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrollments() {
      const supabase = createClient();
      
      // Get current user if not provided
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id;
      }

      if (!targetUserId) {
        setLoading(false);
        return;
      }

      // Fetch enrollments with program details
      const { data: enrollmentData } = await supabase
        .from('program_enrollments')
        .select(`
          id,
          status,
          progress,
          created_at,
          programs(id, name, slug)
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      // Fetch program enrollments for additional status
      const { data: programEnrollments } = await supabase
        .from('program_enrollments')
        .select('id, status, program_id, enrolled_at')
        .eq('user_id', targetUserId);

      if (enrollmentData) {
        const processed: EnrollmentData[] = enrollmentData.map((e: any) => {
          const program = e.programs as any;
          const progress = e.progress || 0;
          
          // Determine status based on progress and enrollment status
          let status: EnrollmentStatus = e.status || 'enrolled';
          if (progress === 100) status = 'completed';
          else if (progress > 0) status = 'in_progress';

          const nextAction = determineNextAction({ ...e, progress_percent: progress, status });

          return {
            id: e.id,
            status,
            program_name: program?.name || 'Program',
            program_id: program?.id || '',
            progress_percent: progress,
            enrolled_at: e.created_at,
            next_action: nextAction.action,
            next_action_url: nextAction.url,
          };
        });

        setEnrollments(processed);
      }

      setLoading(false);
    }

    fetchEnrollments();
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

  if (enrollments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 mb-2">No Active Enrollments</h3>
        <p className="text-slate-600 mb-4">Start your journey by enrolling in a program</p>
        <Link 
          href="/programs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700"
        >
          Browse Programs
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {enrollments.map((enrollment) => {
        const config = statusConfig[enrollment.status];
        const Icon = config.icon;

        return (
          <div 
            key={enrollment.id} 
            className="bg-white rounded-2xl border border-slate-200 p-6"
          >
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.color}`}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{config.label}</span>
              </div>
              <span className="text-sm text-slate-500">
                Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
              </span>
            </div>

            {/* Program Name */}
            <h3 className="font-bold text-slate-900 text-lg mb-3">{enrollment.program_name}</h3>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Progress</span>
                <span className="font-medium text-slate-900">{enrollment.progress_percent}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${enrollment.progress_percent}%` }}
                />
              </div>
            </div>

            {/* Next Action */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600 mb-2">Next Step</p>
              <Link 
                href={enrollment.next_action_url}
                className="flex items-center justify-between group"
              >
                <span className="font-medium text-slate-900 group-hover:text-brand-green-600 transition">
                  {enrollment.next_action}
                </span>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-green-600 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
