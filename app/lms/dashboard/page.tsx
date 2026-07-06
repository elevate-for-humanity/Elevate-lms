'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardHero } from '@/components/lms/dashboard/DashboardHero';
import { EnrolledProgramsList } from '@/components/lms/dashboard/EnrolledProgramsList';
import { EmptyEnrollmentState } from '@/components/lms/dashboard/EmptyEnrollmentState';
import { PendingApprovalNotice } from '@/components/lms/dashboard/PendingApprovalNotice';
import { StudentToolsStrip } from '@/components/lms/dashboard/StudentToolsStrip';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { BookOpen, Award, Calendar, MessageSquare } from 'lucide-react';

interface Enrollment {
  id: string;
  status: string;
  progress_percent?: number | null;
  program_id?: string;
  programs?: { id: string; title: string; slug: string; code?: string } | null;
}

export default function LMSDashboard() {
  const [user, setUser] = useState<{ id: string; email?: string; full_name?: string } | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Get user's enrollments
      if (authUser) {
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('*, programs(id, title, slug, code)')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        setEnrollments(enrollData || []);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || 'Student';
  const activeEnrollments = enrollments.filter(e => e.status === 'active' || e.status === 'confirmed');
  const pendingEnrollments = enrollments.filter(e => e.status === 'pending' || e.status === 'awaiting_payment');
  const hasActiveEnrollment = activeEnrollments.length > 0;
  const avgProgress = activeEnrollments.length > 0
    ? activeEnrollments.reduce((sum, e) => sum + (e.progress_percent || 0), 0) / activeEnrollments.length
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-8 px-8 md:px-12">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              Welcome Back, {firstName}
            </h1>
            <p className="text-blue-100 mb-6">
              {hasActiveEnrollment
                ? 'Pick up where you left off — your next lesson is ready.'
                : 'Start your journey by browsing available programs.'}
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/lms/courses" className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition">
                <BookOpen className="w-6 h-6 text-white mb-2" />
                <div className="text-2xl font-bold text-white">{enrollments.length}</div>
                <div className="text-sm text-blue-200">Programs</div>
              </Link>
              <Link href="/lms/assignments" className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition">
                <Award className="w-6 h-6 text-white mb-2" />
                <div className="text-2xl font-bold text-white">{Math.round(avgProgress)}%</div>
                <div className="text-sm text-blue-200">Progress</div>
              </Link>
              <Link href="/lms/calendar" className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition">
                <Calendar className="w-6 h-6 text-white mb-2" />
                <div className="text-2xl font-bold text-white">-</div>
                <div className="text-sm text-blue-200">Upcoming</div>
              </Link>
              <Link href="/lms/ai-tutor" className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition">
                <MessageSquare className="w-6 h-6 text-white mb-2" />
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-blue-200">AI Tutor</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Pending Approval Notice */}
        {pendingEnrollments.length > 0 && (
          <PendingApprovalNotice count={pendingEnrollments.length} />
        )}

        {/* Student Tools Strip */}
        <StudentToolsStrip />

        {/* Programs Section */}
        {activeEnrollments.length > 0 ? (
          <EnrolledProgramsList enrollments={activeEnrollments} />
        ) : (
          <EmptyEnrollmentState />
        )}
      </div>
    </div>
  );
}
