"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useEffect, useState } from "react";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  user_name?: string;
};

export function CourseReviewsSection({ courseId }: { courseId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Direct DB query for reviews
        const { data } = await supabase
          .from('course_reviews')
          .select(`
            id, rating, title, body, created_at,
            profiles:user_id (full_name)
          `)
          .eq('course_id', courseId)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setReviews(data.map((r: any) => ({
            ...r,
            user_name: r.profiles?.full_name || 'Anonymous'
          })));
          setLoading(false);
          return;
        }

        // Fallback to API
        const res = await fetch(`/api/courses/${courseId}/reviews`);
        const json = await res.json();
        setReviews(json.reviews || []);
      } catch (e) {
        // Error logged
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, text }),
      });
      if (res.ok) {
        setTitle("");
        setText("");
        const updated = await fetch(`/api/courses/${courseId}/reviews`);
        const json = await updated.json();
        setReviews(json.reviews || []);
      } else {
        // Error logged
      }
    } catch (e) {
      // Error logged
    } finally {
      setSubmitting(false);
    }
  };

  const avg =
    reviews.length > 0
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : 0;

  return (
    <section className="mt-8 space-y-4 rounded-xl border p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Student reviews</h2>
        <div className="text-xs text-black">
          ⭐ {avg.toFixed(1)} ({reviews.length} reviews)
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-slate-500">
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <ul className="space-y-3 text-xs">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {r.title || `${r.rating}-star review`}
                </div>
                <div>⭐ {r.rating}</div>
              </div>
              {r.body && (
                <p className="mt-1 text-black whitespace-pre-line">
                  {r.body}
                </p>
              )}
              <p className="mt-1 text-[11px] text-slate-500">
                {r.user_name || "Student"} ·{" "}
                {new Date(r.created_at).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-4 space-y-2 border-t pt-4 text-xs"
      >
        <p className="font-semibold">Leave a review</p>
        <label className="flex items-center gap-2">
          Rating
          <select
            value={rating}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setRating(Number(e.target.value))}
            className="rounded border px-2 py-2 text-xs"
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} stars
              </option>
            ))}
          </select>
        </label>

        <input
          type="text"
          placeholder="Short title (optional)"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTitle(e.target.value)}
          className="w-full rounded border px-2 py-2 text-xs"
        />

        <textarea
          placeholder="Share details that will help other learners…"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setText(e.target.value)}
          className="h-20 w-full rounded border px-2 py-2 text-xs"
        />

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60 hover:bg-brand-blue-700 transition"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </section>
  );
}
