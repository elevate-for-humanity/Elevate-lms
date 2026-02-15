"use client";


import React from 'react';

import { useState } from 'react';
import { Upload, FileText, Link as LinkIcon, Calendar, AlertCircle } from 'lucide-react';

interface AssignmentActivityProps {
  assignmentId: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: Date;
  maxPoints: number;
  submissionType: 'file' | 'text' | 'url' | 'multiple';
  allowedFileTypes?: string[];
  maxFileSizeMB?: number;
  allowLateSubmission?: boolean;
  onSubmit?: (data: any) => void;
}

export function AssignmentActivity({
  assignmentId,
  title,
  description,
  instructions,
  dueDate,
  maxPoints,
  submissionType,
  allowedFileTypes = ['.pdf', '.doc', '.docx'],
  maxFileSizeMB = 10,
  allowLateSubmission = true,
  onSubmit
}: AssignmentActivityProps) {
  const [submissionText, setSubmissionText] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOverdue = new Date() > dueDate;
  const canSubmit = allowLateSubmission || !isOverdue;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        const extension = '.' + file.name.split('.').pop();
        return allowedFileTypes.includes(extension) && file.size <= maxFileSizeMB * 1024 * 1024;
      });
      setSelectedFiles(validFiles);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submission = {
        assignmentId,
        submissionText,
        submissionUrl,
        files: selectedFiles,
        submittedAt: new Date()
      };
      await onSubmit?.(submission);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">{title}</h2>
        <div className="flex items-center gap-4 text-sm text-black">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Due: {dueDate.toLocaleDateString()}
          </span>
          <span>Points: {maxPoints}</span>
          {isOverdue && (
            <span className="flex items-center gap-1 text-brand-orange-600">
              <AlertCircle className="w-4 h-4" />
              Overdue
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="font-semibold text-black mb-2">Description</h3>
        <p className="text-black">{description}</p>
      </div>

      {/* Instructions */}
      <div className="mb-6 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-brand-blue-900 mb-2">Instructions</h3>
        <div className="text-brand-blue-800 text-sm whitespace-pre-wrap">{instructions}</div>
      </div>

      {/* Submission Area */}
      {canSubmit && (
        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-semibold text-black mb-4">Your Submission</h3>

          {/* File Upload */}
          {(submissionType === 'file' || submissionType === 'multiple') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                Upload Files
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-500 transition">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <input
                  type="file"
                  multiple={submissionType === 'multiple'}
                  accept={allowedFileTypes.join(',')}
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-sm text-brand-orange-600 hover:text-red-700 font-medium"
                >
                  Click to upload
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  {allowedFileTypes.join(', ')} (max {maxFileSizeMB}MB)
                </p>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-black">
                      <FileText className="w-4 h-4" />
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Text Submission */}
          {(submissionType === 'text' || submissionType === 'multiple') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                Text Submission
              </label>
              <textarea
                value={submissionText}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSubmissionText(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter your submission text here..."
              />
            </div>
          )}

          {/* URL Submission */}
          {(submissionType === 'url' || submissionType === 'multiple') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                URL Submission
              </label>
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={submissionUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSubmissionUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-brand-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </div>
      )}

      {!canSubmit && (
        <div className="border-t border-slate-200 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <AlertCircle className="w-8 h-8 text-brand-orange-600 mx-auto mb-2" />
            <p className="text-red-800 font-medium">
              This assignment is overdue and no longer accepts submissions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
