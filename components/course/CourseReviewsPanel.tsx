"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState } from "react";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

export function CourseReviewsPanel({
  courseId,
  reviews,
  ratingStats,
  canReview,
}: {
  courseId: string;
  reviews: Review[];
  ratingStats: { average: number; count: number };
  canReview: boolean;
}) {
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReview) return;

    setSubmitting(true);
    setError(null);
    try {
      // Direct DB insert for review
      const { data: { user } } = await supabase.auth.getUser();
      const { data: newReview, error: dbError } = await supabase
        .from('course_reviews')
        .insert({
          course_id: courseId,
          user_id: user?.id,
          rating,
          title,
          body,
          created_at: new Date().toISOString()
        })
        .select('id, rating, title, body, created_at')
        .single();

      if (newReview && !dbError) {
        setLocalReviews(prev => [newReview, ...prev]);
        setTitle("");
        setBody("");
        setRating(5);
        setSubmitting(false);
        return;
      }

      // Fallback to API
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, body }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Something went wrong");
      } else if (json.review) {
        // If user updates, replace existing; otherwise add
        setLocalReviews((prev) => {
          const existingIdx = prev.findIndex(
            (r) => r.id === json.review.id
          );
          if (existingIdx >= 0) {
            const clone = [...prev];
            clone[existingIdx] = json.review;
            return clone;
          }
          return [json.review, ...prev];
        });
        setTitle("");
        setBody("");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const computedStats =
    ratingStats && ratingStats.count
      ? ratingStats
      : {
          average:
            localReviews.length > 0
              ? localReviews.reduce((a, r) => a + (r.rating || 0), 0) /
                localReviews.length
              : 0,
          count: localReviews.length,
        };

  return (
    <div className="space-y-2 rounded-xl border bg-white p-3 shadow-sm">
      <h2 className="text-sm font-semibold">Reviews</h2>

      <p className="text-xs text-black">
        ⭐ {computedStats.average.toFixed(1)} average •{" "}
        {computedStats.count} review
        {computedStats.count === 1 ? "" : "s"}
      </p>

      {canReview ? (
        <form
          onSubmit={handleSubmit}
          className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-black">Your rating:</span>
            <select
              value={rating}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setRating(Number(e.target.value))}
              className="rounded border px-2 py-2 text-xs"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </div>
          <input
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTitle(e.target.value)}
            placeholder="Short headline (optional)"
            className="w-full rounded border px-2 py-2 text-xs"
          />
          <textarea
            value={body}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setBody(e.target.value)}
            placeholder="Share what you liked about this course…"
            className="h-20 w-full resize-none rounded border px-2 py-2 text-xs"
          />
          {error && (
            <p className="text-[11px] text-brand-orange-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-brand-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-blue-700 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      ) : (
        <p className="mt-1 text-[11px] text-slate-500">
          Sign in and enroll to leave a review.
        </p>
      )}

      {localReviews.length ? (
        <ul className="mt-2 space-y-1.5 text-xs">
          {localReviews.slice(0, 4).map((r) => (
            <li
              key={r.id}
              className="rounded-lg bg-slate-50 p-2 text-black"
            >
              <p className="font-medium">
                {"⭐".repeat(r.rating || 0)}{" "}
                <span className="text-[11px] text-slate-500">
                  ({r.rating}/5)
                </span>
              </p>
              {r.title && (
                <p className="text-[11px] font-semibold">{r.title}</p>
              )}
              {r.body && (
                <p className="text-[11px] text-black">{r.body}</p>
              )}
              <p className="mt-1 text-[10px] text-slate-500">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[11px] text-slate-500">
          No reviews yet. Be the first to share your experience.
        </p>
      )}
    </div>
  );
}
