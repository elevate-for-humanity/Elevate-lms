"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Review {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export function StudentFeedbackRating({ courseId }: { courseId?: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  // Load reviews from DB
  useEffect(() => {
    async function loadReviews() {
      const { data } = await supabase
        .from('course_reviews')
        .select(`
          id, rating, comment, created_at, helpful_count,
          profiles:user_id (full_name)
        `)
        .eq('course_id', courseId || 'default')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setReviews(data.map((r: any) => ({
          id: r.id,
          studentName: r.profiles?.full_name || 'Anonymous',
          rating: r.rating,
          comment: r.comment,
          date: r.created_at?.split('T')[0],
          helpful: r.helpful_count || 0
        })));
      }
    }
    loadReviews();
  }, [courseId, supabase]);

  // Submit review to DB
  const handleSubmitReview = async () => {
    if (!rating || !comment.trim()) return;
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: newReview } = await supabase
      .from('course_reviews')
      .insert({
        course_id: courseId || 'default',
        user_id: user?.id,
        rating,
        comment: comment.trim(),
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (newReview) {
      setReviews(prev => [{
        id: newReview.id,
        studentName: 'You',
        rating,
        comment: comment.trim(),
        date: new Date().toISOString().split('T')[0],
        helpful: 0
      }, ...prev]);
      setRating(0);
      setComment('');
    }
    setIsSubmitting(false);
  };

  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Course Feedback</h1>
          <p className="text-white">Share your learning experience</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Write a Review</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-3xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Your Review</label>
                  <textarea
                    value={comment}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setComment(e.target.value)}
                    placeholder="Share your experience with this course..."
                    className="w-full px-4 py-2 border rounded-lg h-32"
                  />
                </div>

                <Button className="w-full">Submit Review</Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Student Reviews ({reviews.length})</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">{review.studentName}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-black mb-3">{review.comment}</p>
                    <button className="text-sm text-black hover:text-black">
                      👍 Helpful ({review.helpful})
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Overall Rating</h3>
              <div className="text-center mb-4">
                <p className="text-5xl font-bold text-brand-orange-600 text-3xl md:text-4xl lg:text-5xl">{avgRating.toFixed(1)}</p>
                <div className="flex justify-center my-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-2xl ${i < Math.round(avgRating) ? 'text-yellow-500' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm text-black">Based on {reviews.length} reviews</p>
              </div>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviews.filter(r => r.rating === stars).length;
                  const percentage = (count / reviews.length) * 100;
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-sm w-8">{stars}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-black w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6   ">
              <h3 className="font-bold mb-2">💡 Review Guidelines</h3>
              <ul className="text-sm text-black space-y-2">
                <li>• Be specific and constructive</li>
                <li>• Focus on course content and delivery</li>
                <li>• Respect others' opinions</li>
                <li>• Avoid personal attacks</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
