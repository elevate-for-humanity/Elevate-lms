import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Compass,
  Users,
  Circle,
  Target,
  ArrowRight,
  Calendar,
  MessageSquare,
  TrendingUp,
  Heart,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Career Counseling - Find Your Path | Elevate for Humanity',
  description:
    'One-on-one career counseling to help you discover your strengths, explore career options, and create a plan for success.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/career-services/career-counseling',
  },
};

export default function CareerCounselingPage() {
  const counselingAreas = [
    {
      icon: Compass,
      title: 'Career Exploration',
      description: 'Discover careers that match your interests, skills, and values',
    },
    {
      icon: Target,
      title: 'Goal Setting',
      description: 'Create actionable short-term and long-term career goals',
    },
    {
      icon: TrendingUp,
      title: 'Career Transitions',
      description: 'Navigate career changes and industry switches successfully',
    },
    {
      icon: Heart,
      title: 'Work-Life Balance',
      description: 'Find careers that align with your lifestyle priorities',
    },
  ];

  const assessments = [
    {
      name: 'Skills Assessment',
      description: 'Identify your transferable and technical skills',
    },
    {
      name: 'Interest Inventory',
      description: 'Discover careers that match your passions',
    },
    {
      name: 'Values Clarification',
      description: 'Understand what matters most to you in a career',
    },
    {
      name: 'Personality Assessment',
      description: 'Learn how your personality fits different work environments',
    },
  ];

  return (
    <div className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services', href: '/career-services' }, { label: 'Career Counseling' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[350px] md:h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/community/event-5.jpg"
          alt="Career Counseling Services"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-4">
            Free for Program Participants
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Career Counseling
          </h1>
          <p className="text-xl md:text-2xl mb-6">
            Discover your path. Achieve your potential.
          </p>
          <Link
            href="/career-services/contact"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all inline-flex items-center"
          >
            Schedule a Session <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            How We Can Help
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our certified career counselors provide personalized guidance to help you navigate your career journey.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {counselingAreas.map((area, index) => (
              <div key={index} className="bg-brand-blue-50 rounded-xl p-6 text-center hover:shadow-lg transition">
                <area.icon className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{area.title}</h3>
                <p className="text-gray-600 text-sm">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Our Counseling Process
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Initial Consultation</h3>
              <p className="text-gray-600 text-sm">Meet with a counselor to discuss your background, goals, and challenges</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Assessment</h3>
              <p className="text-gray-600 text-sm">Complete career assessments to identify your strengths and interests</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Exploration</h3>
              <p className="text-gray-600 text-sm">Research career options and educational pathways that fit your profile</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Action Plan</h3>
              <p className="text-gray-600 text-sm">Create a personalized roadmap with concrete steps to reach your goals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Assessments */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Career Assessments
          </h2>
          <p className="text-gray-600 text-center mb-8">
            We use proven assessment tools to help you understand yourself better and make informed career decisions.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {assessments.map((assessment, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 flex items-start">
                <Circle className="w-6 h-6 text-brand-blue-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{assessment.name}</h3>
                  <p className="text-gray-600 text-sm">{assessment.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Benefits */}
      <section className="py-16 bg-brand-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Who Benefits from Career Counseling?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Career Changers</h3>
              <p className="text-gray-600 mb-4">
                Feeling stuck or unfulfilled? We help you identify transferable skills and explore new directions.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Identify transferable skills
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Explore new industries
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Plan your transition
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">New Graduates</h3>
              <p className="text-gray-600 mb-4">
                Starting your career journey? We help you translate your education into employment.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Explore career options
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Build your professional brand
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Navigate the job market
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Returning Workers</h3>
              <p className="text-gray-600 mb-4">
                Re-entering the workforce? We help you update your skills and rebuild your confidence.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Address employment gaps
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Update your skills
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Rebuild confidence
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Session Types */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Session Options
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
              <div className="flex items-center mb-4">
                <Users className="w-8 h-8 text-brand-blue-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">In-Person Sessions</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Meet face-to-face with a career counselor at one of our locations.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  60-minute sessions
                </li>
                <li className="flex items-center">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Hands-on activities
                </li>
                <li className="flex items-center">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Access to resource library
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
              <div className="flex items-center mb-4">
                <MessageSquare className="w-8 h-8 text-brand-blue-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Virtual Sessions</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Connect with a counselor from anywhere via video call.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Flexible scheduling
                </li>
                <li className="flex items-center">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  No travel required
                </li>
                <li className="flex items-center">
                  <Circle className="w-4 h-4 text-green-600 mr-2" />
                  Screen sharing for resources
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 bg-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-2xl italic mb-6">
            &quot;Career counseling helped me realize I had more options than I thought. My counselor helped me see how my skills could transfer to a completely new field. Now I am in a career I love.&quot;
          </p>
          <p className="text-brand-blue-200">— Maria S., Program Graduate</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Explore Your Options?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Schedule a free consultation with one of our career counselors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all inline-flex items-center justify-center"
            >
              <Calendar className="mr-2 w-5 h-5" />
              Schedule Consultation
            </Link>
            <Link
              href="/career-services"
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-lg text-lg font-bold transition-all"
            >
              View All Career Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
