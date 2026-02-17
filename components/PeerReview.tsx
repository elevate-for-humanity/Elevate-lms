"use client";

import React from 'react';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Star, ThumbsUp, MessageSquare, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Review {
  id: string;
  reviewer: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  helpful: number;
  timestamp: string;
}

interface PeerReviewProps {
  assignmentId: string;
  studentName: string;
}

export function PeerReview({ assignmentId, studentName }: PeerReviewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
  });

  const fetchReviews = useCallback(async () => {
    const supabase = createClient();
    
    try {
      const { data } = await supabase
        .from('peer_reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: false });

      if (data) {
        const formatted: Review[] = data.map(r => ({
          id: r.id,
          reviewer: r.profiles?.full_name || 'Anonymous',
          reviewerAvatar: r.profiles?.avatar_url || '/media/avatars/default.jpg',
          rating: r.rating,
          comment: r.comment,
          helpful: r.helpful_count || 0,
          timestamp: getRelativeTime(r.created_at),
        }));
        setReviews(formatted);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      // Fallback data
      setReviews([
        { id: '1', reviewer: 'Sarah Johnson', reviewerAvatar: '/media/avatars/avatar-1.jpg', rating: 5, comment: 'Excellent work!', helpful: 12, timestamp: '2 days ago' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const submitReview = async () => {
    if (newReview.rating === 0 || !newReview.comment.trim()) return;
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('peer_reviews').insert({
      assignment_id: assignmentId,
      reviewer_id: user?.id,
      rating: newReview.rating,
      comment: newReview.comment,
    });
    
    setNewReview({ rating: 0, comment: '' });
    fetchReviews();
  };

  const handleSubmitReview = () => {
    if (newReview.rating === 0 || !newReview.comment.trim()) {
      alert('Please provide both a rating and comment');
      return;
    }

    const review: Review = {
      id: Date.now().toString(),
      reviewer: 'You',
      reviewerAvatar: '/media/avatars/avatar-default.jpg',
      rating: newReview.rating,
      comment: newReview.comment,
      helpful: 0,
      timestamp: 'Just now',
    };

    setReviews([review, ...reviews]);
    setNewReview({ rating: 0, comment: '' });
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="  ">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-brand-orange-600 mb-1">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={star <= averageRating ? 'fill-brand-orange-500 text-brand-orange-500' : 'text-gray-300'}
                  />
                ))}
              </div>
              <div className="text-sm text-black">{reviews.length} peer reviews</div>
            </div>
            <div className="text-center">
              <Award className="text-brand-orange-600 mx-auto mb-2" size={48} />
              <div className="text-sm font-semibold">Peer Review Badge</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Review */}
      <Card>
        <CardHeader>
          <CardTitle>Write a Peer Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="transition hover:scale-110"
                >
                  <Star
                    size={32}
                    className={star <= newReview.rating ? 'fill-brand-orange-500 text-brand-orange-500' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Your Review</label>
            <textarea
              value={newReview.comment}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="Provide constructive feedback..."
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
              rows={4}
            />
            <div className="text-xs text-gray-500 mt-2">
              Be specific, constructive, and respectful in your feedback
            </div>
          </div>

          <Button
            onClick={handleSubmitReview}
            className="w-full bg-brand-orange-600 hover:bg-brand-orange-700"
          >
            Submit Review
          </Button>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Peer Reviews ({reviews.length})</h3>

        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Image
                  src={review.reviewerAvatar}
                  alt={review.reviewer}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold">{review.reviewer}</div>
                      <div className="text-xs text-gray-500">{review.timestamp}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={star <= review.rating ? 'fill-brand-orange-500 text-brand-orange-500' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-black mb-3">{review.comment}</p>

                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-sm text-black hover:text-brand-orange-600 transition">
                      <ThumbsUp size={16} />
                      <span>Helpful ({review.helpful})</span>
                    </button>
                    <button className="flex items-center gap-2 text-sm text-black hover:text-brand-orange-600 transition">
                      <MessageSquare size={16} />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
