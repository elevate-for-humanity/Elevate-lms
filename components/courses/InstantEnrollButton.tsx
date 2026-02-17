'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Loader2 } from 'lucide-react';

interface InstantEnrollButtonProps {
  courseId: string;
  courseName?: string;
  price?: number;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export default function InstantEnrollButton({
  courseId,
  courseName,
  price,
  className = '',
  variant = 'primary',
}: InstantEnrollButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEnroll = () => {
    setLoading(true);
    router.push(`/courses/${courseId}/enroll`);
  };

  const baseClasses = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-brand-orange-500 hover:bg-brand-orange-600 text-white',
    secondary: 'bg-white hover:bg-gray-50 text-brand-orange-600 border-2 border-brand-orange-500',
  };

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label={`Enroll in ${courseName || 'course'}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          Enroll Now
          {price && price > 0 && (
            <span className="ml-1">- ${price}</span>
          )}
        </>
      )}
    </button>
  );
}
