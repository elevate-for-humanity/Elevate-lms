"use client";

import React from 'react';

import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

interface FeedbackWidgetProps {
  userId: string;
}

export default function FeedbackWidget({ userId }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const feedbackTypes = [
    { value: 'bug', label: '🐛 Bug Report', color: 'red' },
    { value: 'feature', label: '💡 Feature Request', color: 'blue' },
    { value: 'improvement', label: '⚡ Improvement', color: 'yellow' },
    { value: 'complaint', label: '😞 Complaint', color: 'orange' },
    { value: 'praise', label: '🎉 Praise', color: 'green' },
    { value: 'other', label: '📝 Other', color: 'gray' },
  ];

  const categories = [
    'User Interface',
    'Performance',
    'Content',
    'Navigation',
    'Mobile Experience',
    'Accessibility',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!type || !title || !description) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          type,
          title,
          description,
          category,
          pageUrl: window.location.href,
          browserInfo: navigator.userAgent,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setType('');
          setTitle('');
          setDescription('');
          setCategory('');
        }, 2000);
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-blue-600 text-white rounded-full shadow-lg hover:bg-brand-blue-700 transition-all hover:scale-110 z-40 flex items-center justify-center"
        title="Send Feedback"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b   ">
              <div>
                <h3 className="text-xl font-bold text-black">
                  Send Feedback
                </h3>
                <p className="text-sm text-black">
                  Help us improve your experience
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-black transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            {submitted ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24"
stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-black mb-2">
                    Thank You!
                  </h4>
                  <p className="text-black">
                    Your feedback has been submitted. We'll review it shortly.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    What type of feedback is this? *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {feedbackTypes.map(ft => (
                      <button
                        key={ft.value}
                        type="button"
                        onClick={() => setType(ft.value)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          type === ft.value
                            ? 'border-brand-blue-600 bg-brand-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{ft.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    placeholder="Brief summary of your feedback"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    placeholder="Provide as much detail as possible..."
                    required
                  />
                </div>

                {/* Info */}
                <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
                  <p className="text-sm text-brand-blue-800">
                    <strong>Note:</strong> Your feedback will include the current page URL and browser information to help us investigate issues.
                  </p>
                </div>
              </form>
            )}

            {/* Footer */}
            {!submitted && (
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-6 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !type || !title || !description}
                  className="flex items-center gap-2 px-6 py-2 text-white bg-brand-blue-600 rounded-lg hover:bg-brand-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
