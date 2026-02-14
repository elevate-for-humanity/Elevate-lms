"use client";

import Link from 'next/link';
import { CheckCircle, Clock, Upload, FileText, Calendar, AlertCircle } from 'lucide-react';

interface Requirement {
  id: string;
  requirement_type: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  evidence_url: string | null;
}

interface RequirementsChecklistProps {
  requirements: Requirement[];
  enrollmentId: string;
}

export function RequirementsChecklist({ requirements, enrollmentId }: RequirementsChecklistProps) {
  const getRequirementIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <Upload className="w-5 h-5" />;
      case 'hours':
        return <Clock className="w-5 h-5" />;
      case 'appointment':
        return <Calendar className="w-5 h-5" />;
      case 'course':
        return <FileText className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getActionLink = (req: Requirement) => {
    switch (req.requirement_type) {
      case 'course':
        return '/student/courses';
      case 'document':
        return '/student/documents';
      case 'hours':
        return '/student/hours-tracking';
      case 'appointment':
        return '/student/appointments';
      default:
        return '#';
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'document':
        return 'Upload Document →';
      case 'hours':
        return 'Log Hours →';
      case 'appointment':
        return 'Schedule Appointment →';
      case 'course':
        return 'Start Course →';
      default:
        return 'Complete →';
    }
  };

  // Sort: overdue first, then by due date
  const sortedRequirements = [...requirements].sort((a, b) => {
    const aOverdue = a.due_date && new Date(a.due_date) < new Date();
    const bOverdue = b.due_date && new Date(b.due_date) < new Date();

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }

    return 0;
  });

  if (sortedRequirements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No requirements yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedRequirements.map((req) => {
        const isOverdue = req.due_date && new Date(req.due_date) < new Date();
        const isCompleted = req.status === 'completed' || req.status === 'verified';
        const isPending = req.status === 'pending' || req.status === 'in_progress';

        let borderColor = 'border-gray-300';
        let bgColor = 'bg-gray-50';
        let iconColor = 'text-black';

        if (isCompleted) {
          borderColor = 'border-green-300';
          bgColor = 'bg-green-50';
          iconColor = 'text-green-600';
        } else if (isOverdue) {
          borderColor = 'border-red-500';
          bgColor = 'bg-red-50';
          iconColor = 'text-brand-orange-600';
        } else if (req.priority === 'urgent' || req.priority === 'high') {
          borderColor = 'border-yellow-500';
          bgColor = 'bg-yellow-50';
          iconColor = 'text-yellow-600';
        } else if (isPending) {
          borderColor = 'border-brand-blue-500';
          bgColor = 'bg-brand-blue-50';
          iconColor = 'text-brand-blue-600';
        }

        return (
          <div
            key={req.id}
            className={`flex items-start gap-4 p-4 ${bgColor} border-l-4 ${borderColor} rounded ${isCompleted ? 'opacity-60' : ''}`}
          >
            <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                getRequirementIcon(req.requirement_type)
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">
                {isCompleted && '✓ '}
                {req.title}
              </h3>
              {req.description && (
                <p className="text-sm text-black mb-2">
                  {req.description}
                </p>
              )}
              {req.due_date && (
                <p className={`text-sm mb-2 ${isOverdue ? 'text-brand-orange-600 font-semibold' : 'text-black'}`}>
                  Due: {new Date(req.due_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {isOverdue && ' (OVERDUE)'}
                </p>
              )}
              {!isCompleted && (
                <Link
                  href={getActionLink(req)}
                  className="text-sm text-brand-blue-600 hover:underline font-semibold"
                >
                  {getActionText(req.requirement_type)}
                </Link>
              )}
              {isCompleted && req.status === 'verified' && (
                <p className="text-sm text-green-600">
                  Verified and approved
                </p>
              )}
              {isCompleted && req.status === 'completed' && (
                <p className="text-sm text-yellow-600">
                  Awaiting verification
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
