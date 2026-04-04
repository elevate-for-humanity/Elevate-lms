"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  helpful_count: number;
}

interface CourseReviewsProps {
  courseId: string;
}

export function CourseReviews({ courseId }: CourseReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 5 | 4 | 3 | 2 | 1>('all');

  useEffect(() => {
    loadReviews();
  }, [courseId]);

  async function loadReviews() {
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalReviews || 0);
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    }
  }

  async function submitReview() {
    if (userRating === 0 || !userComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: userRating,
          comment: userComment,
        }),
      });

      if (res.ok) {
        setUserRating(0);
        setUserComment('');
        loadReviews();
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setSubmitting(false);
    }
  }

  async function markHelpful(reviewId: string) {
    try {
      await fetch(`/api/courses/${courseId}/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });
      loadReviews();
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    }
  }

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.rating === filter);

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: totalReviews > 0
      ? (reviews.filter(r => r.rating === rating).length / totalReviews) * 100
      : 0,
  }));

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-2xl font-bold text-black mb-6">Student Reviews</h3>

      {/* Rating Summary */}
      <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200">
        <div className="text-center">
          <div className="text-5xl font-bold text-black mb-2 text-3xl md:text-4xl lg:text-5xl">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 ${
                  star <= averageRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-slate-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-black">{totalReviews} reviews</p>
        </div>

        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <button
              key={rating}
              onClick={() => setFilter(rating as string)}
              className="flex items-center gap-3 w-full hover:bg-slate-50 p-2 rounded transition"
            >
              <span className="text-sm font-medium text-black w-12">
                {rating} star
              </span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-black w-12 text-right">
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Write Review */}
      <div className="mb-8 pb-8 border-b border-slate-200">
        <h4 className="text-lg font-semibold text-black mb-4">Write a Review</h4>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black mb-2">
            Your Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setUserRating(star)}
                className="transition hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= userRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black mb-2">
            Your Review
          </label>
          <textarea
            value={userComment}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setUserComment(e.target.value)}
            placeholder="Share your experience with this course..."
            className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={submitReview}
          disabled={submitting || userRating === 0 || !userComment.trim()}
          className="px-6 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 text-sm rounded-lg ${
            filter === 'all'
              ? 'bg-brand-orange-600 text-white'
              : 'bg-slate-100 text-black'
          }`}
        >
          All Reviews
        </button>
        {filter !== 'all' && (
          <span className="text-sm text-black">
            Showing {filter} star reviews
          </span>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <div key={review.id} className="border-b border-slate-200 pb-6 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-black">{review.user_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-slate-500">
                      {new Date(review.created_at).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-black mb-3">{review.comment}</p>
              <button
                onClick={() => markHelpful(review.id)}
                className="flex items-center gap-2 text-sm text-black hover:text-brand-orange-600"
              >
                <ThumbsUp className="w-4 h-4" />
                Helpful ({review.helpful_count})
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-500 py-8">
            No reviews yet. Be the first to review this course!
          </p>
        )}
      </div>
    </div>
  );
}
