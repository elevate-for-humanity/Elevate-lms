"use client";

import React from 'react';

import { useState } from 'react';
import { Flag, X } from 'lucide-react';

interface ReportContentButtonProps {
  contentType: 'course' | 'discussion' | 'comment' | 'review' | 'message' | 'profile';
  contentId: string;
  className?: string;
}

export default function ReportContentButton({
  contentType,
  contentId,
  className = '',
}: ReportContentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reasons = [
    { value: 'spam', label: 'Spam or advertising' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'copyright', label: 'Copyright violation' },
    { value: 'misinformation', label: 'Misinformation' },
    { value: 'hate_speech', label: 'Hate speech' },
    { value: 'violence', label: 'Violence or threats' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      alert('Please select a reason');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
          contentType,
          contentId,
          reason,
          description,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setReason('');
          setDescription('');
        }, 2000);
      } else {
        alert('Failed to submit report. Please try again.');
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 text-black hover:text-brand-orange-600 transition-colors ${className}`}
        title="Report content"
      >
        <Flag className="w-4 h-4" />
        <span className="text-sm">Report</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Flag className="w-5 h-5 text-brand-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">
                    Report Content
                  </h3>
                  <p className="text-sm text-gray-500">
                    Help us keep the community safe
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-black transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            {submitted ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                </div>
                <h4 className="text-lg font-semibold text-black mb-2">
                  Report Submitted
                </h4>
                <p className="text-black">
                  Thank you for helping us maintain a safe community. We'll review this report shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Reason Selection */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Why are you reporting this?
                  </label>
                  <div className="space-y-2">
                    {reasons.map(r => (
                      <label
                        key={r.value}
                        className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r.value}
                          checked={reason === r.value}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setReason(e.target.value)}
                          className="w-4 h-4 text-brand-orange-600 border-gray-300 focus:ring-red-500"
                        />
                        <span className="text-sm text-black">{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Provide any additional context..."
                  />
                </div>

                {/* Info */}
                <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
                  <p className="text-sm text-brand-blue-800">
                    Your report will be reviewed by our moderation team. False reports may result in account restrictions.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !reason}
                    className="flex-1 px-4 py-2 text-white bg-brand-orange-600 rounded-lg hover:bg-brand-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
