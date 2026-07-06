'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, ThumbsUp, Loader2, CheckCircle2 } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  reviewer_name?: string;
  created_at: string;
  helpful_count?: number;
}

interface CourseReviewsPanelProps {
  courseId: string;
  courseName: string;
}

function StarRow({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(s)}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              s <= (hovered || rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function CourseReviewsPanel({ courseId, courseName }: CourseReviewsPanelProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, rating, title, body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to submit review');
        return;
      }
      setSubmitted(true);
      setShowForm(false);
      fetchReviews();
    } catch {
      setError('Network error — try again');
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="mt-8 border-t pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Student Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRow rating={Math.round(avgRating)} />
              <span className="text-sm text-slate-600">
                {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        {!submitted && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 rounded-xl p-5 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
            <StarRow rating={rating} interactive onRate={setRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Review (optional)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder={`What did you think of ${courseName}?`}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      )}

      {submitted && (
        <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-4 mb-6 text-sm text-brand-green-700 font-medium">
<CheckCircle2 className="w-4 h-4 mr-1" /> Review submitted — thank you!
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-slate-100 pb-5 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRow rating={r.rating} />
                    {r.title && <span className="text-sm font-semibold text-slate-900">{r.title}</span>}
                  </div>
                  {r.body && <p className="text-sm text-slate-700 mt-1">{r.body}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{r.reviewer_name ?? 'Student'}</span>
                    <span>·</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    {(r.helpful_count ?? 0) > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> {r.helpful_count} helpful
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
