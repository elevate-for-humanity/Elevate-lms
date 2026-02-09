import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Users,
  Award,
  Briefcase,
  Clock,
  DollarSign,
  Smartphone,
  BarChart,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/features',
  },
  title: 'Platform Features | Elevate For Humanity',
  description:
    'Discover the features that make Elevate For Humanity the leading workforce development platform. Automated workflows with guided support and career placement.',
};

export default async function FeaturesPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch platform features
  const { data: features } = await supabase
    .from('platform_features')
    .select('*')
    .order('order_index');

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Features" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes-hq/employer-hero.jpg"
          alt="Platform Features"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Built for Success
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100">
            Everything you need to learn, grow, and launch your career—all in
            one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/programs"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black">
              Everything You Need to Succeed
            </h2>
            <p className="text-base md:text-lg text-black max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with personalized
              support to help you achieve your career goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <BookOpen className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Interactive Learning
              </h3>
              <p className="text-black">
                Engage with video lessons, quizzes, hands-on projects, and
                real-world simulations designed by industry experts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-green-100 rounded-lg mb-4">
                <Users className="w-6 h-6 text-brand-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                1-on-1 Support
              </h3>
              <p className="text-black">
                Get personalized guidance from instructors, career coaches, and
                mentors who are invested in your success.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Industry Certifications
              </h3>
              <p className="text-black">
                Earn recognized credentials from leading organizations that
                employers actively seek when hiring.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
                <Briefcase className="w-6 h-6 text-brand-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Career Services
              </h3>
              <p className="text-black">
                Access resume building, interview prep, job matching, and direct
                connections to hiring employers.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4">
                <Clock className="w-6 h-6 text-brand-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Flexible Schedule
              </h3>
              <p className="text-black">
                Learn at your own pace with 24/7 access to course materials.
                Balance training with work and family commitments.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Funded
              </h3>
              <p className="text-black">
                No tuition, no hidden fees. We're funded by government grants
                and employer partnerships to keep training free.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-lg mb-4">
                <Smartphone className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Mobile App
              </h3>
              <p className="text-black">
                Install our PWA directly from your browser. Learn on the go with
                offline access and push notifications.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 rounded-lg mb-4">
                <BarChart className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Progress Tracking
              </h3>
              <p className="text-black">
                Monitor your learning journey with detailed analytics,
                completion badges, and skill assessments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Experience Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/images/success-new/success-12.jpg"
                alt="Learning Experience"
                fill
                className="object-cover"
                quality={100}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                Designed for Real-World Success
              </h2>
              <p className="text-black mb-6">
                Our platform isn't just about watching videos. You'll work on
                real projects, collaborate with peers, and build a portfolio
                that demonstrates your skills to employers.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-brand-green-600 mr-2 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-black">
                    Hands-on projects that mirror actual job tasks
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-brand-green-600 mr-2 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-black">
                    Peer collaboration and discussion forums
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-brand-green-600 mr-2 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-black">
                    Instant feedback on assignments and quizzes
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-brand-green-600 mr-2 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-black">
                    Digital portfolio to showcase your work
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                You're Never Alone
              </h2>
              <p className="text-black mb-6">
                From day one, you'll have a dedicated support team helping you
                overcome barriers and stay on track. We provide wraparound
                services that address the whole person, not just the student.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-brand-green-600 mr-2 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-black">
                    Case management and barrier removal support
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-brand-green-600 mr-2 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-black">
                    Financial assistance for transportation, childcare, and
                    tools
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-brand-green-600 mr-2 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-black">
                    Mental health and wellness resources
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-brand-green-600 mr-2 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-black">
                    24/7 technical support and live chat
                  </span>
                </li>
              </ul>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl order-1 md:order-2">
              <Image
                src="/images/business/professional-2.jpg"
                alt="Student Support"
                fill
                className="object-cover"
                quality={100}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Experience the Difference?
          </h2>
          <p className="text-base md:text-lg mb-8 text-blue-100">
            Join thousands of learners who are building better futures with
            Elevate For Humanity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors border-2 border-white"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
