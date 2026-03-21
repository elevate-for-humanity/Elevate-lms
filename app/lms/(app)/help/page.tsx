import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  HelpCircle, Book, MessageCircle, Phone, Mail, 
  FileText, Video, Search, ChevronRight, ExternalLink
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/help',
  },
  title: 'Help Center | LMS | Elevate For Humanity',
  description: 'Get help with your courses, technical issues, and account questions. Access tutorials, FAQs, and contact support.',
};

const helpCategories = [
  {
    title: 'Getting Started',
    icon: Book,
    description: 'New to the platform? Start here.',
    links: [
      { label: 'Platform Overview', href: '/lms/help/getting-started' },
      { label: 'How to Enroll in Courses', href: '/lms/help/enrollment' },
      { label: 'Navigating Your Dashboard', href: '/lms/help/dashboard' },
      { label: 'Setting Up Your Profile', href: '/lms/help/profile' },
    ],
  },
  {
    title: 'Courses & Learning',
    icon: Video,
    description: 'Help with course content and progress.',
    links: [
      { label: 'Accessing Course Materials', href: '/lms/help/course-access' },
      { label: 'Completing Assignments', href: '/lms/help/assignments' },
      { label: 'Taking Quizzes & Exams', href: '/lms/help/quizzes' },
      { label: 'Tracking Your Progress', href: '/lms/help/progress' },
    ],
  },
  {
    title: 'Technical Support',
    icon: HelpCircle,
    description: 'Troubleshoot common issues.',
    links: [
      { label: 'Video Playback Issues', href: '/lms/help/video-issues' },
      { label: 'Login Problems', href: '/lms/help/login-issues' },
      { label: 'Browser Compatibility', href: '/lms/help/browsers' },
      { label: 'Mobile App Help', href: '/lms/help/mobile' },
    ],
  },
  {
    title: 'Certificates & Credentials',
    icon: FileText,
    description: 'Information about certifications.',
    links: [
      { label: 'Earning Certificates', href: '/lms/help/certificates' },
      { label: 'Downloading Your Certificate', href: '/lms/help/download-cert' },
      { label: 'Verification & Sharing', href: '/lms/help/verification' },
      { label: 'Continuing Education Credits', href: '/lms/help/ce-credits' },
    ],
  },
];

const faqs = [
  {
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page and enter your email. You\'ll receive a reset link within a few minutes.',
  },
  {
    question: 'Can I access courses on my phone?',
    answer: 'Yes! Our platform is fully mobile-responsive. You can access all courses through your mobile browser or download our app.',
  },
  {
    question: 'How long do I have access to a course?',
    answer: 'Most courses provide lifetime access once enrolled. Some certification courses have specific completion deadlines noted in the course description.',
  },
  {
    question: 'What if I fail a quiz?',
    answer: 'Don\'t worry! Most quizzes allow multiple attempts. Review the material and try again. Your highest score is recorded.',
  },
  {
    question: 'How do I contact my instructor?',
    answer: 'Use the "Message Instructor" button on your course page, or post in the course discussion forum.',
  },
];

export default async function HelpPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/lms/help');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Help Center' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-brand-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How Can We Help?
          </h1>
          <p className="text-xl text-brand-blue-100 mb-8">
            Find answers, tutorials, and support for your learning journey.
          </p>
          
          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-300"
            />
          </div>
        </div>
      </section>

      {/* Quick Contact */}
      <section className="py-8 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <a href="/support" className="flex items-center gap-4 p-4 rounded-xl hover:bg-white transition-colors">
              <div className="w-12 h-12 bg-brand-green-100 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-brand-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Contact Us</div>
                <div className="text-gray-600">(317) 314-3757</div>
              </div>
            </a>
            <a href="/contact" className="flex items-center gap-4 p-4 rounded-xl hover:bg-white transition-colors">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Email Support</div>
                <div className="text-gray-600">Contact Us</div>
              </div>
            </a>
            <Link href="/learner/messages" className="flex items-center gap-4 p-4 rounded-xl hover:bg-white transition-colors">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Send Message</div>
                <div className="text-gray-600">Contact your instructor</div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Browse Help Topics</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {helpCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <category.icon className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{category.title}</h3>
                    <p className="text-gray-600 text-sm">{category.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {category.links.map((link, i) => (
                    <li key={i}>
                      <Link 
                        href={link.href}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white text-gray-700 hover:text-brand-blue-600 transition-colors"
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="group bg-white rounded-xl">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-600">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Still Need Help?
          </h2>
          <p className="text-gray-300 mb-8">
            Our support team is available Monday-Friday, 9am-5pm EST.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/lms/dashboard"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
