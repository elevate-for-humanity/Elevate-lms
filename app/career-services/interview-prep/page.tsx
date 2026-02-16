import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Video,

  MessageSquare,
  Target,
  ArrowRight,
  Clock,
  Star,
  Briefcase,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Interview Preparation - Ace Your Next Interview | Elevate for Humanity',
  description:
    'Professional interview coaching, mock interviews, and proven strategies to help you land your dream job. Free for program participants.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/career-services/interview-prep',
  },
};

export default function InterviewPrepPage() {
  const interviewTypes = [
    {
      title: 'Behavioral Interviews',
      description: 'Master the STAR method for answering behavioral questions',
      icon: MessageSquare,
    },
    {
      title: 'Technical Interviews',
      description: 'Practice industry-specific technical questions',
      icon: Target,
    },
    {
      title: 'Panel Interviews',
      description: 'Strategies for handling multiple interviewers',
      icon: Users,
    },
    {
      title: 'Video Interviews',
      description: 'Tips for virtual and recorded video interviews',
      icon: Video,
    },
  ];

  const tips = [
    'Research the company thoroughly before your interview',
    'Prepare 3-5 questions to ask the interviewer',
    'Practice your answers out loud, not just in your head',
    'Dress professionally, even for video interviews',
    'Arrive 10-15 minutes early (or log in early for virtual)',
    'Bring copies of your resume and a notepad',
    'Follow up with a thank-you email within 24 hours',
    'Use specific examples from your experience',
  ];

  return (
    <div className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services', href: '/career-services' }, { label: 'Interview Prep' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[350px] md:h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes/event-1.jpg"
          alt="Interview Preparation Services"
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
            Interview Preparation
          </h1>
          <p className="text-xl md:text-2xl mb-6">
            Confidence comes from preparation. We will get you ready.
          </p>
          <Link
            href="/career-services/contact"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all inline-flex items-center"
          >
            Schedule Mock Interview <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Our Interview Prep Services
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            From mock interviews to personalized coaching, we provide everything you need to walk into your interview with confidence.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {interviewTypes.map((type, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
                <type.icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{type.title}</h3>
                <p className="text-gray-600 text-sm">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mock Interview Process */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Mock Interview Process
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Schedule</h3>
              <p className="text-gray-600 text-sm">Book a session with our career coach at a time that works for you</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Prepare</h3>
              <p className="text-gray-600 text-sm">Share the job description and your resume so we can customize</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Practice</h3>
              <p className="text-gray-600 text-sm">Complete a realistic mock interview with industry-specific questions</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Feedback</h3>
              <p className="text-gray-600 text-sm">Receive detailed feedback and actionable tips for improvement</p>
            </div>
          </div>
        </div>
      </section>

      {/* STAR Method */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Master the STAR Method
          </h2>

          <div className="bg-brand-blue-50 rounded-xl p-8 border-2 border-brand-blue-200">
            <p className="text-gray-700 mb-6 text-center">
              The STAR method is a structured way to answer behavioral interview questions by describing a specific Situation, Task, Action, and Result.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <span className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">S</span>
                  <h3 className="text-lg font-bold text-gray-900">Situation</h3>
                </div>
                <p className="text-gray-600 text-sm">Describe the context and background. Set the scene for your story.</p>
              </div>

              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <span className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">T</span>
                  <h3 className="text-lg font-bold text-gray-900">Task</h3>
                </div>
                <p className="text-gray-600 text-sm">Explain your responsibility or the challenge you faced.</p>
              </div>

              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <span className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">A</span>
                  <h3 className="text-lg font-bold text-gray-900">Action</h3>
                </div>
                <p className="text-gray-600 text-sm">Describe the specific steps you took to address the situation.</p>
              </div>

              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <span className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">R</span>
                  <h3 className="text-lg font-bold text-gray-900">Result</h3>
                </div>
                <p className="text-gray-600 text-sm">Share the outcome and what you learned. Quantify when possible.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Top Interview Tips
          </h2>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-gray-700 leading-relaxed">
              Research the company thoroughly before your interview so you can speak to their mission and recent work. 
              Prepare 3 to 5 questions to ask the interviewer — this shows genuine interest. Practice your answers out loud, not just in your head, 
              and use specific examples from your experience. Dress professionally even for video interviews. 
              Arrive 10 to 15 minutes early (or log in early for virtual interviews) and bring copies of your resume and a notepad. 
              After the interview, follow up with a thank-you email within 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Common Questions */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Common Interview Questions
          </h2>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Tell me about yourself.</h3>
              <p className="text-gray-600 text-sm">
                Focus on your professional background, key achievements, and why you are interested in this role. Keep it to 2-3 minutes.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Why do you want to work here?</h3>
              <p className="text-gray-600 text-sm">
                Show you have researched the company. Connect your skills and goals to their mission and the specific role.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">What is your greatest weakness?</h3>
              <p className="text-gray-600 text-sm">
                Be honest but strategic. Choose a real weakness and explain what you are doing to improve it.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Where do you see yourself in 5 years?</h3>
              <p className="text-gray-600 text-sm">
                Show ambition while being realistic. Align your goals with potential growth at the company.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stats */}
      <section className="py-16 bg-brand-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold mb-2">Full</p>
              <p className="text-brand-blue-200">Interview Prep</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">1-on-1</p>
              <p className="text-brand-blue-200">Mock Interviews</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">Expert</p>
              <p className="text-brand-blue-200">Coaching</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">Free</p>
              <p className="text-brand-blue-200">For Program Participants</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Ace Your Interview?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Schedule a mock interview with our career coaches today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/career-services/contact"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all inline-flex items-center justify-center"
            >
              Schedule Mock Interview <ArrowRight className="ml-2 w-5 h-5" />
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
