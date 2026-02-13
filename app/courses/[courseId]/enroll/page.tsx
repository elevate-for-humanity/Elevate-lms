'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle, Clock, Award, CreditCard } from 'lucide-react';



export default function CourseEnrollPage({
  params,
}: {
  params: { courseId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEnrollNow = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: params.courseId,
          successUrl: `${window.location.origin}/courses/${params.courseId}/success`,
          cancelUrl: `${window.location.origin}/courses/${params.courseId}/enroll`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Courses", href: "/courses" }, { label: "Enroll" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-black mb-4">
            Enroll Now - Instant Access
          </h1>
          <p className="text-xl text-black">
            Complete your enrollment in 2 minutes and start learning immediately
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Benefits */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-6">
              What You Get
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">
                    Instant Access
                  </h3>
                  <p className="text-black">
                    Start learning immediately after enrollment. No waiting for approval.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">
                    Self-Paced Learning
                  </h3>
                  <p className="text-black">
                    Learn on your schedule. Access course materials 24/7 from any device.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Award className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">
                    Certificate of Completion
                  </h3>
                  <p className="text-black">
                    Earn a certificate upon completing the course to showcase your skills.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>100% Money-Back Guarantee:</strong> If you're not satisfied within 30 days, we'll refund your purchase.
              </p>
            </div>
          </div>

          {/* Right Column - Checkout */}
          <div className="bg-white rounded-2xl border-2 border-orange-500 p-8">
            <div className="text-center mb-6">
              <div className="inline-block px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-bold mb-4">
                ⚡ Instant Enrollment
              </div>
              <h2 className="text-3xl font-black text-black mb-2">
                Ready to Start?
              </h2>
              <p className="text-black">
                Click below to complete your enrollment
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={handleEnrollNow}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl text-lg font-bold transition-colors flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Enroll Now - Secure Checkout
                </>
              )}
            </button>

            <div className="mt-6 space-y-3 text-sm text-black">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Secure payment via Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Instant access after payment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>30-day money-back guarantee</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                By enrolling, you agree to our{' '}
                <a href="/terms-of-service" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy-policy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-2xl border-2 border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-black mb-2">
                When can I start the course?
              </h3>
              <p className="text-black">
                Immediately after enrollment! You'll get instant access to all course materials.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-black mb-2">
                What if I need help during the course?
              </h3>
              <p className="text-black">
                You'll have access to our support team and course instructors throughout your learning journey.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-black mb-2">
                Is there a refund policy?
              </h3>
              <p className="text-black">
                Yes! We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-black mb-2">
                Do I need to wait for approval?
              </h3>
              <p className="text-black">
                No! This is instant enrollment. You'll get immediate access after payment.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <p className="text-black mb-2">Have questions?</p>
          <a
            href="/support"
            className="text-xl font-bold text-orange-600 hover:text-orange-700"
          >
            Call support center
          </a>
        </div>
      </div>
    </div>
  );
}
