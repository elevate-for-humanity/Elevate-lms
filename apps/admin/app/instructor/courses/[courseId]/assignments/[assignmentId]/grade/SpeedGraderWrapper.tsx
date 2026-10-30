'use client';

import SpeedGrader from '@/components/gradebook/SpeedGrader';
import { Rubric } from '@/lib/gradebook/types';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface SubmissionData {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  content: string;
  attachments: string[];
  status: 'submitted' | 'graded' | 'returned' | 'late';
  isLate: boolean;
  existingGrade: any;
}

interface Props {
  courseId: string;
  assignment: {
    id: string;
    title: string;
    points: number;
    rubric?: Rubric;
  };
  submissions: SubmissionData[];
}

export default function SpeedGraderWrapper({ courseId, assignment, submissions }: Props) {
  const handleGrade = async (
    submissionId: string,
    grade: { points?: number; feedback?: string },
  ) => {
    const response = await fetch('/api/grade/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentSubmissionId: submissionId,
        points: grade.points,
        feedback: grade.feedback,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to save grade.');
  };

  if (submissions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600 text-lg">No submissions to grade yet.</p>
        <Link
          href={`/instructor/courses/${courseId}/gradebook`}
          className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gradebook
        </Link>
      </div>
    );
  }

  // Map to the format SpeedGrader expects
  const formattedSubmissions = submissions.map((s) => ({
    id: s.id,
    assignmentId: s.assignmentId,
    studentId: s.studentId,
    submittedAt: new Date(s.submittedAt),
    content: s.content,
    attachments: s.attachments,
    status: s.status,
    isLate: s.isLate,
  }));

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-50">
        <Link
          href={`/instructor/courses/${courseId}/gradebook`}
          className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow text-sm text-slate-700 hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Gradebook
        </Link>
      </div>
      <SpeedGrader
        submissions={formattedSubmissions}
        assignment={assignment}
        onGrade={handleGrade}
      />
    </div>
  );
}
