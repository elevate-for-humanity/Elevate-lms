import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Mail, Phone, Calendar, ArrowRight, Heart, Shield, Award, ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/courses/hsi/success',
  },
  title: 'Enrollment Confirmed | HSI Safety Training | Elevate For Humanity',
  description: 'Your HSI safety training enrollment is confirmed. Access your CPR, First Aid, or safety certification course.',
};

export default async function HSISuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;
  let enrollment = null;

  if (supabase) {
    await db.from('page_views').insert({ page: 'hsi_course_success' }).select();
    
    // Try to fetch enrollment details if session_id provided
    if (session_id) {
      const { data } = await db
        .from('hsi_enrollment_queue')
        .select('*, course:hsi_course_products(*)')
        .eq('stripe_session_id', session_id)
        .single();
      enrollment = data;
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Courses', href: '/courses' },
          { label: 'HSI Safety Training', href: '/courses/hsi' },
          { label: 'Enrollment Confirmed' }
        ]} />
      </div>

      {/* Success Hero */}
      <section className="py-16 bg-brand-green-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Enrollment Confirmed!
          </h1>
          {enrollment?.course?.course_name && (
            <p className="text-xl text-brand-green-700 font-semibold mb-4">
              {enrollment.course.course_name}
            </p>
          )}
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            You're now enrolled in HSI Safety Training. Check your email for login credentials and course access instructions.
          </p>
          <div className="inline-flex items-center gap-2 bg-brand-green-100 text-brand-green-800 px-6 py-3 rounded-full font-semibold">
            <Heart className="w-5 h-5" />
            Thank you for choosing Elevate for Humanity
          </div>
        </div>
      </section>

      {/* HSI Course Access */}
      {enrollment?.course?.hsi_enrollment_link && (
        <section className="py-12 bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Your Course Now</h2>
            <p className="text-gray-600 mb-6">
              Click below to start your HSI training immediately. You'll also receive an email with this link.
            </p>
            <a
              href={enrollment.course.hsi_enrollment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Start HSI Training <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </section>
      )}

      {/* Next Steps */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">What Happens Next</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-brand-blue-600" />
              </div>
              <div className="text-sm text-brand-blue-600 font-semibold mb-2">Step 1</div>
              <h3 className="font-bold text-gray-900 mb-2">Check Your Email</h3>
              <p className="text-gray-600 text-sm">
                You'll receive an email from HSI with your login credentials within 24 hours.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
              <div className="w-14 h-14 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-brand-orange-600" />
              </div>
              <div className="text-sm text-brand-orange-600 font-semibold mb-2">Step 2</div>
              <h3 className="font-bold text-gray-900 mb-2">Complete Online Training</h3>
              <p className="text-gray-600 text-sm">
                Log in to the HSI platform and complete your online coursework at your own pace.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
              <div className="w-14 h-14 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-brand-green-600" />
              </div>
              <div className="text-sm text-brand-green-600 font-semibold mb-2">Step 3</div>
              <h3 className="font-bold text-gray-900 mb-2">Get Certified</h3>
              <p className="text-gray-600 text-sm">
                Pass the skills assessment and receive your official HSI certification card.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Important Information */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-brand-blue-50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-brand-blue-600" />
              Important Information
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">
                  <strong>Course Access:</strong> Your HSI course access is valid for 1 year from enrollment date.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">
                  <strong>Certification Valid:</strong> CPR/First Aid certifications are valid for 2 years.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">
                  <strong>Skills Session:</strong> For CPR certification, you'll need to complete an in-person or remote skills verification session.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">
                  <strong>Certificate Download:</strong> Your digital certificate will be available immediately after passing.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Need Help */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Need Help?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-bold text-gray-900 mb-4">Elevate for Humanity Support</h3>
              <p className="text-gray-600 text-sm mb-4">
                Questions about your enrollment or funding?
              </p>
              <div className="space-y-2">
                <a href="/support" className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700">
                  <Phone className="w-4 h-4" />
                  (317) 314-3757
                </a>
                <a href="mailto:info@elevateforhumanity.org" className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700">
                  <Mail className="w-4 h-4" />
                  info@elevateforhumanity.org
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-bold text-gray-900 mb-4">HSI Technical Support</h3>
              <p className="text-gray-600 text-sm mb-4">
                Issues with the HSI learning platform?
              </p>
              <div className="space-y-2">
                <a href="mailto:support@hsi.com" className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700">
                  <Mail className="w-4 h-4" />
                  support@hsi.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Explore More Training Opportunities
          </h2>
          <p className="text-gray-300 mb-8">
            Continue building your skills with our other free training programs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              Browse All Programs <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white hover:bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
