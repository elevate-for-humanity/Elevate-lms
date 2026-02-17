"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Circle, Loader2, AlertCircle, Clock, Users, TrendingUp, Zap } from 'lucide-react';

interface WorkflowStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed' | 'skipped';
  automated: boolean;
  completed_at?: string;
  error_message?: string;
}

interface EnrollmentData {
  id: string;
  user_id: string;
  program_id?: string;
  course_id?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  student?: { full_name: string; email: string };
  program?: { name: string };
  course?: { title: string };
}

interface EnrollmentStats {
  enrollmentsToday: number;
  enrollmentsYesterday: number;
  avgProcessingTimeMinutes: number;
  successRate: number;
  pendingCount: number;
  failedCount: number;
}

interface Props {
  enrollmentId?: string;
  showStats?: boolean;
  onStepComplete?: (step: WorkflowStep) => void;
  onWorkflowComplete?: (enrollment: EnrollmentData) => void;
}

const DEFAULT_WORKFLOW_STEPS: Omit<WorkflowStep, 'id'>[] = [
  { step_number: 1, title: 'Application Received', description: 'Student submitted enrollment application', status: 'pending', automated: true },
  { step_number: 2, title: 'Eligibility Verification', description: 'Checking funding eligibility (WIOA, WRG, JRI)', status: 'pending', automated: true },
  { step_number: 3, title: 'Document Collection', description: 'Required documents uploaded and verified', status: 'pending', automated: false },
  { step_number: 4, title: 'Background Check', description: 'Background verification if required by program', status: 'pending', automated: true },
  { step_number: 5, title: 'Payment Processing', description: 'Payment or funding authorization processed', status: 'pending', automated: true },
  { step_number: 6, title: 'Course Access Provisioned', description: 'LMS access and materials assigned', status: 'pending', automated: true },
  { step_number: 7, title: 'Welcome Communication', description: 'Welcome email and orientation info sent', status: 'pending', automated: true },
  { step_number: 8, title: 'Enrollment Complete', description: 'Student fully enrolled and ready to begin', status: 'pending', automated: true },
];

export default function AutomatedEnrollmentWorkflow({ 
  enrollmentId, 
  showStats = true,
  onStepComplete,
  onWorkflowComplete 
}: Props) {
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [stats, setStats] = useState<EnrollmentStats>({
    enrollmentsToday: 0,
    enrollmentsYesterday: 0,
    avgProcessingTimeMinutes: 0,
    successRate: 0,
    pendingCount: 0,
    failedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<number | null>(null);

  const supabase = createClient();

  const deriveWorkflowFromStatus = useCallback((status: string): WorkflowStep[] => {
    return DEFAULT_WORKFLOW_STEPS.map((step, index) => {
      let derivedStatus: WorkflowStep['status'] = 'pending';
      
      switch (status) {
        case 'completed':
        case 'active':
          derivedStatus = 'completed';
          break;
        case 'approved':
          derivedStatus = step.step_number <= 6 ? 'completed' : (step.step_number === 7 ? 'in_progress' : 'pending');
          break;
        case 'payment_pending':
          derivedStatus = step.step_number <= 4 ? 'completed' : (step.step_number === 5 ? 'in_progress' : 'pending');
          break;
        case 'documents_pending':
          derivedStatus = step.step_number <= 2 ? 'completed' : (step.step_number === 3 ? 'in_progress' : 'pending');
          break;
        case 'pending':
        case 'submitted':
          derivedStatus = step.step_number === 1 ? 'completed' : (step.step_number === 2 ? 'in_progress' : 'pending');
          break;
        case 'rejected':
        case 'cancelled':
          derivedStatus = step.step_number <= 2 ? 'completed' : 'skipped';
          break;
        default:
          derivedStatus = 'pending';
      }

      return {
        ...step,
        id: `step-${index}`,
        status: derivedStatus,
        completed_at: derivedStatus === 'completed' ? new Date().toISOString() : undefined,
      };
    });
  }, []);

  const fetchEnrollmentData = useCallback(async () => {
    if (!enrollmentId) {
      setWorkflow(DEFAULT_WORKFLOW_STEPS.map((s, i) => ({ ...s, id: `step-${i}` })));
      setLoading(false);
      return;
    }

    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          id,
          user_id,
          program_id,
          course_id,
          status,
          created_at,
          updated_at,
          profiles!enrollments_user_id_fkey(full_name, email),
          training_programs(name),
          courses(title)
        `)
        .eq('id', enrollmentId)
        .single();

      if (enrollmentError) throw enrollmentError;

      const formattedEnrollment: EnrollmentData = {
        ...enrollmentData,
        student: enrollmentData.profiles as any,
        program: enrollmentData.training_programs as any,
        course: enrollmentData.courses as any,
      };
      setEnrollment(formattedEnrollment);

      const derivedWorkflow = deriveWorkflowFromStatus(enrollmentData.status);
      setWorkflow(derivedWorkflow);
    } catch (err: any) {
      console.error('Error fetching enrollment:', err);
      setError('Failed to load enrollment');
      setWorkflow(DEFAULT_WORKFLOW_STEPS.map((s, i) => ({ ...s, id: `step-${i}` })));
    }
  }, [enrollmentId, supabase, deriveWorkflowFromStatus]);

  const fetchStats = useCallback(async () => {
    if (!showStats) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: todayCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const { count: yesterdayCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      const { count: totalCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: completedCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'completed'])
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: pendingCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'submitted', 'documents_pending', 'payment_pending']);

      const { count: failedCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['rejected', 'cancelled', 'failed']);

      setStats({
        enrollmentsToday: todayCount || 0,
        enrollmentsYesterday: yesterdayCount || 0,
        avgProcessingTimeMinutes: 15,
        successRate: totalCount ? Math.round(((completedCount || 0) / totalCount) * 100) : 0,
        pendingCount: pendingCount || 0,
        failedCount: failedCount || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [showStats, supabase]);

  const processStep = async (stepNumber: number) => {
    if (!enrollmentId) return;
    
    setProcessingStep(stepNumber);
    
    try {
      const updatedWorkflow = workflow.map(step => {
        if (step.step_number === stepNumber) {
          return { ...step, status: 'completed' as const, completed_at: new Date().toISOString() };
        }
        if (step.step_number === stepNumber + 1) {
          return { ...step, status: 'in_progress' as const };
        }
        return step;
      });
      
      setWorkflow(updatedWorkflow);

      const statusMap: Record<number, string> = {
        2: 'documents_pending',
        3: 'approved',
        4: 'payment_pending',
        5: 'approved',
        6: 'active',
        7: 'active',
        8: 'active',
      };

      if (statusMap[stepNumber]) {
        await supabase
          .from('enrollments')
          .update({ status: statusMap[stepNumber], updated_at: new Date().toISOString() })
          .eq('id', enrollmentId);
      }

      const completedStep = updatedWorkflow.find(s => s.step_number === stepNumber);
      if (completedStep && onStepComplete) {
        onStepComplete(completedStep);
      }

      const allComplete = updatedWorkflow.every(s => s.status === 'completed' || s.status === 'skipped');
      if (allComplete && enrollment && onWorkflowComplete) {
        onWorkflowComplete(enrollment);
      }

    } catch (err) {
      console.error('Error processing step:', err);
    } finally {
      setProcessingStep(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEnrollmentData(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchEnrollmentData, fetchStats]);

  useEffect(() => {
    if (!enrollmentId) return;

    const channel = supabase
      .channel(`enrollment-${enrollmentId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'enrollments', filter: `id=eq.${enrollmentId}` },
        (payload) => {
          if (payload.new) {
            const newStatus = (payload.new as any).status;
            const derivedWorkflow = deriveWorkflowFromStatus(newStatus);
            setWorkflow(derivedWorkflow);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enrollmentId, supabase, deriveWorkflowFromStatus]);

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return <span className="text-slate-400 flex-shrink-0">•</span>;
      case 'in_progress': return <Loader2 className="w-5 h-5 text-brand-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-brand-red-500" />;
      case 'skipped': return <Circle className="w-5 h-5 text-gray-400" />;
      default: return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusBg = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-brand-green-50 border-brand-green-200';
      case 'in_progress': return 'bg-brand-blue-50 border-brand-blue-200';
      case 'failed': return 'bg-brand-red-50 border-brand-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const percentChange = stats.enrollmentsYesterday > 0 
    ? Math.round(((stats.enrollmentsToday - stats.enrollmentsYesterday) / stats.enrollmentsYesterday) * 100)
    : stats.enrollmentsToday > 0 ? 100 : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {enrollment && (
        <Card className="p-4 bg-gradient-to-r from-brand-blue-50 to-indigo-50 border-brand-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {enrollment.student?.full_name || 'Student'}
              </h3>
              <p className="text-sm text-gray-600">
                {enrollment.program?.name || enrollment.course?.title || 'Program'}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                enrollment.status === 'active' ? 'bg-brand-green-100 text-brand-green-800' :
                enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {enrollment.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Enrollment Workflow</h2>
          <span className="text-sm text-gray-500">
            {workflow.filter(s => s.status === 'completed').length} / {workflow.length} steps complete
          </span>
        </div>

        <div className="space-y-3">
          {workflow.map((step, index) => (
            <div 
              key={step.id} 
              className={`p-4 rounded-lg border transition-all ${getStatusBg(step.status)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {processingStep === step.step_number ? (
                    <Loader2 className="w-5 h-5 text-brand-blue-500 animate-spin" />
                  ) : (
                    getStatusIcon(step.status)
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">STEP {step.step_number}</span>
                    {step.automated && (
                      <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        <Zap className="w-3 h-3" /> Auto
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                  
                  {step.completed_at && step.status === 'completed' && (
                    <p className="text-xs text-gray-400 mt-1">
                      Completed {new Date(step.completed_at).toLocaleString()}
                    </p>
                  )}
                  
                  {step.error_message && (
                    <p className="text-xs text-brand-red-600 mt-1">{step.error_message}</p>
                  )}
                </div>

                {!step.automated && step.status === 'in_progress' && enrollmentId && (
                  <Button
                    size="sm"
                    onClick={() => processStep(step.step_number)}
                    disabled={processingStep !== null}
                  >
                    {processingStep === step.step_number ? 'Processing...' : 'Complete'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.enrollmentsToday}</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>
            <p className={`text-xs mt-2 ${percentChange >= 0 ? 'text-brand-green-600' : 'text-brand-red-600'}`}>
              {percentChange >= 0 ? '↑' : '↓'} {Math.abs(percentChange)}% vs yesterday
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-brand-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.avgProcessingTimeMinutes}m</p>
                <p className="text-xs text-gray-500">Avg Time</p>
              </div>
            </div>
            <p className="text-xs mt-2 text-gray-500">Processing time</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                <p className="text-xs text-gray-500">Success</p>
              </div>
            </div>
            <p className="text-xs mt-2 text-gray-500">30-day rate</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingCount}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
            <p className="text-xs mt-2 text-brand-red-500">{stats.failedCount} failed</p>
          </Card>
        </div>
      )}

      {error && (
        <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg">
          <p className="text-sm text-brand-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
