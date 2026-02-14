'use client';

import { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';

interface FeedbackFormProps {
  courseId: string;
  courseName: string;
  onSubmit?: (data: { rating: number; feedback: string }) => void;
}

export function FeedbackForm({ courseId, courseName, onSubmit }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (onSubmit) {
      onSubmit({ rating, feedback });
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-6 h-6 text-green-600 fill-current" />
        </div>
        <h3 className="text-lg font-bold text-green-800 mb-2">Thank You!</h3>
        <p className="text-green-700">Your feedback helps us improve our courses.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Rate This Course</h3>
      <p className="text-gray-600 text-sm mb-4">{courseName}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 transition ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Text */}
        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
            Your Feedback (optional)
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            placeholder="What did you like? What could be improved?"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Feedback
            </>
          )}
        </button>
      </form>
    </div>
  );
}
