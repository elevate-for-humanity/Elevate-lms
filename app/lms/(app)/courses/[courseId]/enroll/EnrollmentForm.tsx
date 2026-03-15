'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard } from 'lucide-react';

interface Props {
  courseId: string;
  courseName: string;
  price: number;
  userEmail: string;
  userName: string;
}

export default function EnrollmentForm({ courseId, courseName, price, userEmail, userName }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const isFree = price === 0;

  const handleEnroll = async () => {
    if (!agreed) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          firstName: userName.split(' ')[0] || '',
          lastName: userName.split(' ').slice(1).join(' ') || '',
          email: userEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll');
      }

      if (data.checkoutUrl) {
        // Redirect to payment
        window.location.href = data.checkoutUrl;
      } else {
        // Free course - enrolled successfully
        router.push(`/lms/courses/${courseId}?enrolled=true`);
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Info Display */}
      <div className="bg-white rounded-xl p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Enrolling as:</h3>
        <div className="space-y-2">
          <p className="text-slate-700">{userName || 'Student'}</p>
          <p className="text-slate-600 text-sm">{userEmail}</p>
        </div>
      </div>

      {/* Course Summary */}
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-slate-900">{courseName}</p>
            <p className="text-sm text-slate-600">Full course access</p>
          </div>
          <div className="text-right">
            {isFree ? (
              <span className="text-xl font-bold text-brand-green-600">FREE</span>
            ) : (
              <span className="text-xl font-bold text-slate-900">${price}</span>
            )}
          </div>
        </div>
      </div>

      {/* Terms Agreement */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 w-4 h-4 text-brand-blue-600 border-slate-300 rounded focus:ring-brand-blue-500"
        />
        <span className="text-sm text-slate-600">
          I agree to the{' '}
          <a href="/terms-of-service" className="text-brand-blue-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy-policy" className="text-brand-blue-600 hover:underline">Privacy Policy</a>.
          I understand that I will have access to this course upon enrollment.
        </span>
      </label>

      {/* Error Message */}
      {error && (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 text-brand-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Enroll Button */}
      <button
        onClick={handleEnroll}
        disabled={isLoading || !agreed}
        className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : isFree ? (
          <>
            <span className="text-slate-400 flex-shrink-0">•</span>
            Enroll Now - Free
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Proceed to Payment - ${price}
          </>
        )}
      </button>

      {/* Security Note */}
      {!isFree && (
        <p className="text-center text-sm text-slate-500">
          Secure payment powered by Stripe. Your payment information is encrypted.
        </p>
      )}

      {/* Free Course Note */}
      {isFree && (
        <p className="text-center text-sm text-slate-500">
          This course is funded through workforce grants. No payment required for eligible participants.
        </p>
      )}
    </div>
  );
}
