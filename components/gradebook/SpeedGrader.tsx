"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState } from 'react';
import { Submission, Grade, Rubric, RubricScore } from '@/lib/gradebook/types';

interface SpeedGraderProps {
  submissions: Submission[];
  assignment: {
    id: string;
    title: string;
    points: number;
    rubric?: Rubric;
  };
  onGrade: (submissionId: string, grade: Partial<Grade>) => Promise<void>;
}

export default function SpeedGrader({ submissions, assignment, onGrade }: SpeedGraderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [points, setPoints] = useState(assignment.points);
  const [feedback, setFeedback] = useState('');
  const [rubricScores, setRubricScores] = useState<RubricScore[]>([]);
  const [saving, setSaving] = useState(false);

  const currentSubmission = submissions[currentIndex];

  const handleNext = async () => {
    await saveGrade();
    if (currentIndex < submissions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetForm();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetForm();
    }
  };

  const resetForm = () => {
    setPoints(assignment.points);
    setFeedback('');
    setRubricScores([]);
  };

  const saveGrade = async () => {
    if (!currentSubmission) return;

    setSaving(true);
    try {
      const percentage = (points / assignment.points) * 100;

      // Save to database directly
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('grades').upsert({
        submission_id: currentSubmission.id,
        assignment_id: assignment.id,
        student_id: currentSubmission.studentId,
        grader_id: user?.id,
        points,
        max_points: assignment.points,
        percentage,
        feedback,
        rubric_scores: rubricScores,
        graded_at: new Date().toISOString(),
      }).catch(() => {});

      await onGrade(currentSubmission.id, {
        points,
        maxPoints: assignment.points,
        percentage,
        feedback,
        rubricScores: rubricScores.length > 0 ? rubricScores : undefined,
        gradedAt: new Date(),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRubricScore = (criterionId: string, levelId: string, points: number) => {
    setRubricScores(prev => {
      const existing = prev.find(s => s.criterionId === criterionId);
      if (existing) {
        return prev.map(s =>
          s.criterionId === criterionId
            ? { ...s, levelId, points }
            : s
        );
      }
      return [...prev, { criterionId, levelId, points }];
    });

    // Au total from rubric
    if (assignment.rubric) {
      const total = rubricScores.reduce((sum, s) => sum + s.points, 0) + points;
      setPoints(total);
    }
  };

  if (!currentSubmission) {
    return (
      <div className="p-8 text-center text-slate-500">
        No submissions to grade
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-black">{assignment.title}</h1>
            <p className="text-sm text-black">
              Grading {currentIndex + 1} of {submissions.length}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-sm font-medium text-black bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === submissions.length - 1}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentIndex === submissions.length - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Submission View */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-black">
                  Student Submission
                </h2>
                <p className="text-sm text-black">
                  Submitted {new Date(currentSubmission.submittedAt).toLocaleString()}
                  {currentSubmission.isLate && (
                    <span className="ml-2 text-brand-orange-600 font-medium">LATE</span>
                  )}
                </p>
              </div>

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-black">
                  {currentSubmission.content}
                </div>
              </div>

              {currentSubmission.attachments && currentSubmission.attachments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-black mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {currentSubmission.attachments.map((attachment, idx) => (
                      <a
                        key={idx}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 text-sm text-black"
                      >
                        📎 {attachment.split('/').pop()}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grading Panel */}
        <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Points */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Points
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={points}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPoints(Number(e.target.value))}
                  max={assignment.points}
                  min={0}
                  step={0.5}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <span className="text-sm text-black">/ {assignment.points}</span>
              </div>
              <p className="mt-1 text-sm text-black">
                {((points / assignment.points) * 100).toFixed(1)}%
              </p>
            </div>

            {/* Rubric */}
            {assignment.rubric && (
              <div>
                <h3 className="text-sm font-semibold text-black mb-3">Rubric</h3>
                <div className="space-y-4">
                  {assignment.rubric.criteria.map((criterion) => (
                    <div key={criterion.id} className="border border-slate-200 rounded p-3">
                      <h4 className="text-sm font-medium text-black mb-2">
                        {criterion.name}
                      </h4>
                      <p className="text-xs text-black mb-3">
                        {criterion.description}
                      </p>
                      <div className="space-y-2">
                        {criterion.levels.map((level) => (
                          <button
                            key={level.id}
                            onClick={() => handleRubricScore(criterion.id, level.id, level.points)}
                            className={`w-full text-left px-3 py-2 rounded text-sm border ${
                              rubricScores.find(s => s.criterionId === criterion.id)?.levelId === level.id
                                ? 'bg-orange-50 border-orange-500 text-orange-900'
                                : 'bg-white border-slate-200 text-black hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{level.name}</span>
                              <span className="text-xs">{level.points} pts</span>
                            </div>
                            <p className="text-xs mt-1 opacity-75">{level.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFeedback(e.target.value)}
                rows={6}
                placeholder="Provide feedback to the student..."
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>

            {/* Quick Comments */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Quick Comments
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Great work!',
                  'Well done',
                  'Needs improvement',
                  'See me',
                  'Resubmit',
                ].map((comment) => (
                  <button
                    key={comment}
                    onClick={() => setFeedback(prev => prev + (prev ? '\n' : '') + comment)}
                    className="px-3 py-2 text-xs bg-slate-100 text-black rounded hover:bg-slate-200"
                  >
                    {comment}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveGrade}
              disabled={saving}
              className="w-full px-4 py-2 bg-orange-600 text-white font-medium rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Grade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
