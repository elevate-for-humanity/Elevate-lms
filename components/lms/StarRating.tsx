import { Star } from 'lucide-react';

type Props = { rating: number; count?: number; size?: 'sm' | 'md' | 'lg' };

export function StarRating({ rating, count, size = 'md' }: Props) {
  const clamped = Math.max(0, Math.min(5, rating || 0));
  const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-10 w-10' : 'h-4 w-4';

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= clamped ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-black">{clamped.toFixed(1)}</span>
      {typeof count === 'number' && (
        <span className="text-xs text-slate-500">({count.toLocaleString()})</span>
      )}
    </div>
  );
}
