"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import { useState } from 'react';
import Image from 'next/image';

interface Review {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
  helpful: number;
}

interface ProductReviewsProps {
  productId: string;
}

// Hook to load reviews from DB
function useProductReviews(productId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadReviews() {
      const { data } = await supabase
        .from('product_reviews')
        .select(`
          id, rating, title, content, verified_purchase, helpful_count, created_at,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setReviews(data.map((r: any) => ({
          id: r.id,
          author: r.profiles?.full_name || 'Anonymous',
          avatar: r.profiles?.avatar_url,
          rating: r.rating,
          date: r.created_at?.split('T')[0],
          title: r.title,
          content: r.content,
          verified: r.verified_purchase,
          helpful: r.helpful_count || 0
        })));
      }
    }
    loadReviews();
  }, [productId, supabase]);

  return reviews;
}

// Mock reviews - fallback
const mockReviews: Review[] = [
  {
    id: '1',
    author: 'Sarah Johnson',
    rating: 5,
    date: '2024-01-15',
    title: 'Excellent study materials!',
    content: 'These materials helped me pass my certification exam on the first try. The content is well-organized and easy to follow. Highly recommend!',
    verified: true,
    helpful: 24,
  },
  {
    id: '2',
    author: 'Michael Chen',
    rating: 5,
    date: '2024-01-10',
    title: 'Worth every penny',
    content: 'The practice questions were spot-on. I felt completely prepared for the exam. The video demonstrations were particularly helpful.',
    verified: true,
    helpful: 18,
  },
  {
    id: '3',
    author: 'Jessica Martinez',
    rating: 4,
    date: '2024-01-05',
    title: 'Great resource',
    content: 'Very comprehensive materials. Would have liked more practice exams, but overall excellent quality.',
    verified: true,
    helpful: 12,
  },
];

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews] = useState<Review[]>(mockReviews);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful'>('recent');

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const ratingCounts = [5, 4, 3, 2, 1].map(rating =>
    reviews.filter(r => r.rating === rating).length
  );

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'helpful') {
      return b.helpful - a.helpful;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-black mb-6">Customer Reviews</h2>

      {/* Rating Summary */}
      <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200">
        <div className="text-center">
          <div className="text-5xl font-bold text-black mb-2 text-3xl md:text-4xl lg:text-5xl">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-6 h-6 ${
                  star <= averageRating ? 'text-yellow-400' : 'text-slate-300'
                } fill-current`}
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          <div className="text-sm text-black">Based on {reviews.length} reviews</div>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating, index) => (
            <div key={rating} className="flex items-center gap-3">
              <span className="text-sm font-medium text-black w-12">
                {rating} star
              </span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{
                    width: `${(ratingCounts[index] / reviews.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm text-black w-8">
                {ratingCounts[index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-black">
          {reviews.length} Reviews
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'recent' | 'helpful')}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {sortedReviews.map((review) => (
          <div key={review.id} className="p-6 bg-slate-50 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center text-black font-bold">
                  {review.author.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-black">
                      {review.author}
                    </span>
                    {review.verified && (
                      <span className="px-2 py-0.5 bg-brand-green-100 text-brand-green-700 text-xs font-semibold rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-black">
                    {new Date(review.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating ? 'text-yellow-400' : 'text-slate-300'
                    } fill-current`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
            </div>

            <h4 className="font-bold text-black mb-2">{review.title}</h4>
            <p className="text-black mb-4">{review.content}</p>

            <div className="flex items-center gap-4 text-sm">
              <button className="flex items-center gap-2 text-black hover:text-black">
                <svg className="w-4 h-4" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>Helpful ({review.helpful})</span>
              </button>
              <button className="text-black hover:text-black">
                Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Write Review Button */}
      <div className="mt-8 text-center">
        <button className="px-8 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition-all">
          Write a Review
        </button>
      </div>
    </div>
  );
}
