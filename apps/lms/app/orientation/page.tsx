import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { CheckCircle, Play, Clock, Users, BookOpen, MessageCircle, FileText, Video } from 'lucide-react';
import { ParisFloatingWrapper } from '@/components/paris/ParisFloatingWrapper';

export const metadata: Metadata = {
  title: 'Student Orientation | Elevate for Humanity',
  description: 'Complete your orientation to get started with your Elevate program.',
};

const orientationSteps = [
  {
    icon: FileText,
    title: 'Review the Student Handbook',
    description: 'Understand our policies, expectations, and support resources.',
    duration: '15 min',
    link: '/documents/student-handbook',
  },
  {
    icon: Video,
    title: 'Watch the Welcome Video',
    description: 'Hear from our team and learn what to expect.',
    duration: '10 min',
    link: '/videos/welcome',
  },
  {
    icon: BookOpen,
    title: 'Explore Your Program',
    description: 'Get familiar with your curriculum and course materials.',
    duration: '20 min',
    link: '/programs',
  },
  {
    icon: Users,
    title: 'Meet Your Cohort',
    description: 'Connect with fellow students in your program.',
    duration: 'Ongoing',
    link: '/forums',
  },
  {
    icon: MessageCircle,
    title: 'Connect with Paris',
    description: 'Our AI assistant is available 24/7 to help you succeed.',
    duration: 'As needed',
    link: '/ai/paris',
  },
];

const resources = [
  { title: 'Student Handbook', href: '/documents/student-handbook' },
  { title: 'Academic Calendar', href: '/calendar' },
  { title: 'Financial Aid Guide', href: '/financial-aid' },
  { title: 'Career Services', href: '/career-services' },
  { title: 'Technical Support', href: '/support' },
];

export default function OrientationPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Orientation' }]} />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-bold mb-6">
              <Play className="w-4 h-4" />
              Get Started
            </div>
            <h1 className="text-4xl font-black mb-4">Welcome to Elevate</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Complete these orientation steps to set yourself up for success in your program.
            </p>
          </div>
        </div>
      </section>

      {/* Progress */}
      <section className="py-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Orientation Progress</span>
            <span className="text-sm font-bold text-brand-blue-600">0 of 5 complete</span>
          </div>
          <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full w-0 bg-brand-blue-600 rounded-full transition-all" />
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-black mb-8">Your Orientation Checklist</h2>
          <div className="space-y-4">
            {orientationSteps.map((step, index) => (
              <div key={step.title} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-500">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <step.icon className="w-5 h-5 text-brand-blue-600 mt-1" />
                        <div>
                          <h3 className="text-lg font-bold text-black">{step.title}</h3>
                          <p className="text-slate-600 mt-1">{step.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          {step.duration}
                        </span>
                        <Link 
                          href={step.link}
                          className="bg-brand-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors"
                        >
                          Start
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-lg font-bold text-black mb-4">Helpful Resources</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {resources.map((resource) => (
              <Link 
                key={resource.href}
                href={resource.href}
                className="bg-white border border-slate-200 rounded-lg p-4 text-center hover:border-brand-blue-300 hover:shadow-sm transition-all"
              >
                <span className="text-sm font-medium text-slate-700">{resource.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Success Message */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green-100 text-brand-green-800 rounded-full text-sm font-bold mb-4">
            <CheckCircle className="w-4 h-4" />
            Ready to Begin
          </div>
          <h2 className="text-2xl font-bold text-black mb-4">Questions? We're Here to Help.</h2>
          <p className="text-slate-600 mb-8">
            Reach out to our student support team anytime. Paris AI is also available 24/7.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/support" className="bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg hover:bg-slate-300 transition-colors">
              Contact Support
            </Link>
            <Link href="/lms" className="bg-brand-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-blue-700 transition-colors">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <ParisFloatingWrapper />
    </div>
  );
}
