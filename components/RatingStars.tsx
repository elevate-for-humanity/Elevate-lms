import React from 'react';

interface RatingStarsProps {
  rating: number;
}

export function RatingStars({ rating }: RatingStarsProps) {
  const fullStars = Math.round(rating);
  return (
    <span aria-label={`Rating ${rating.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < fullStars ? 'text-yellow-400' : 'text-black'}>
          ★
        </span>
      ))}
    </span>
  );
}
