import Link from 'next/link';
import { Metadata } from 'next';
import { CheckCircle, Play, ArrowRight, Mail } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Purchase Successful | Elevate for Humanity',
  description: 'Thank you for your purchase. Access your courses now.',
};

export const dynamic = 'force-dynamic';

export default async function CourseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  // In production, verify the session with Stripe and record the purchase
  // For now, show success message

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services', href: '/career-services' }, { label: 'Courses', href: '/career-services/courses' }, { label: 'Success' }]} />
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Purchase Successful!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Thank you for your purchase. You now have lifetime access to your courses.
          </p>

          <div className="bg-brand-blue-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-brand-blue-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Check Your Email
            </h3>
            <p className="text-brand-blue-700 text-sm">
              We&apos;ve sent a confirmation email with your receipt and course access instructions.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/career-services/courses/my-courses"
              className="w-full bg-brand-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-brand-blue-700 transition flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Learning Now
            </Link>
            
            <Link
              href="/career-services/courses"
              className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              Browse More Courses
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Questions? Contact us at{' '}
          <a href="mailto:elevate4humanityedu@gmail.com" className="text-brand-blue-600 hover:underline">
            elevate4humanityedu@gmail.com
          </a>
        </p>
      </div>
      </div>
    </div>
  );
}
