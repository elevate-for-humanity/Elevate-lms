import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import {
  Play,
  Clock,
  BookOpen,
  FileText,
  Settings,
  CreditCard,
  GraduationCap,
  Users,
  ArrowRight,
  Search,
  Filter,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/help/tutorials',
  },
  title: 'Video Tutorials | Learn How to Use Our Platform | Elevate For Humanity',
  description:
    'Watch step-by-step video tutorials on how to apply, enroll, access courses, submit assignments, and more.',
};

const tutorialCategories = [
  { id: 'all', name: 'All Tutorials', count: 12 },
  { id: 'getting-started', name: 'Getting Started', count: 4 },
  { id: 'courses', name: 'Courses & Learning', count: 3 },
  { id: 'account', name: 'Account & Settings', count: 3 },
  { id: 'support', name: 'Getting Help', count: 2 },
];

const tutorials = [
  // Getting Started
  {
    id: 'how-to-apply',
    title: 'How to Apply for Programs',
    description: 'Step-by-step guide to completing your application in under 10 minutes.',
    duration: '5:32',
    category: 'getting-started',
    icon: FileText,
    color: 'blue',
    featured: true,
    steps: [
      'Visit the Apply page',
      'Fill in your personal information',
      'Select your program of interest',
      'Choose your funding option',
      'Submit and wait for confirmation',
    ],
  },
  {
    id: 'understanding-funding',
    title: 'Understanding Funding Options',
    description: 'Learn about WIOA, employer sponsorship, and other ways to fund your training.',
    duration: '7:15',
    category: 'getting-started',
    icon: CreditCard,
    color: 'green',
    featured: true,
    steps: [
      'Overview of funding pathways',
      'WIOA eligibility requirements',
      'Employer sponsorship process',
      'Self-pay options and payment plans',
    ],
  },
  {
    id: 'first-day-orientation',
    title: 'Your First Day: Orientation Guide',
    description: 'What to expect on your first day and how to prepare for success.',
    duration: '6:45',
    category: 'getting-started',
    icon: GraduationCap,
    color: 'blue',
    steps: [
      'What to bring on day one',
      'Meeting your instructors',
      'Understanding the schedule',
      'Setting up your student account',
    ],
  },
  {
    id: 'navigating-student-portal',
    title: 'Navigating the Student Portal',
    description: 'Tour of the student dashboard and key features you need to know.',
    duration: '4:20',
    category: 'getting-started',
    icon: BookOpen,
    color: 'orange',
    steps: [
      'Dashboard overview',
      'Finding your courses',
      'Checking your progress',
      'Accessing resources',
    ],
  },
  // Courses & Learning
  {
    id: 'accessing-courses',
    title: 'Accessing Your Courses',
    description: 'How to find, open, and navigate through your enrolled courses.',
    duration: '3:45',
    category: 'courses',
    icon: BookOpen,
    color: 'blue',
    steps: [
      'Logging into the LMS',
      'Finding your enrolled courses',
      'Opening course materials',
      'Tracking your progress',
    ],
  },
  {
    id: 'submitting-assignments',
    title: 'Submitting Assignments',
    description: 'Learn how to upload and submit your assignments correctly.',
    duration: '4:10',
    category: 'courses',
    icon: FileText,
    color: 'green',
    steps: [
      'Finding assignment requirements',
      'Preparing your submission',
      'Uploading files',
      'Confirming submission',
    ],
  },
  {
    id: 'taking-quizzes',
    title: 'Taking Quizzes and Exams',
    description: 'Tips for completing online assessments and viewing your results.',
    duration: '5:00',
    category: 'courses',
    icon: CheckCircle,
    color: 'blue',
    steps: [
      'Starting a quiz',
      'Navigating questions',
      'Submitting your answers',
      'Reviewing results',
    ],
  },
  // Account & Settings
  {
    id: 'updating-profile',
    title: 'Updating Your Profile',
    description: 'How to update your personal information and contact details.',
    duration: '2:30',
    category: 'account',
    icon: Settings,
    color: 'orange',
    steps: [
      'Accessing profile settings',
      'Updating contact information',
      'Changing your password',
      'Saving changes',
    ],
  },
  {
    id: 'notification-settings',
    title: 'Managing Notifications',
    description: 'Control what notifications you receive and how you receive them.',
    duration: '2:15',
    category: 'account',
    icon: Settings,
    color: 'blue',
    steps: [
      'Finding notification settings',
      'Email preferences',
      'SMS notifications',
      'In-app alerts',
    ],
  },
  {
    id: 'downloading-certificates',
    title: 'Downloading Your Certificates',
    description: 'How to access and download your completion certificates.',
    duration: '3:00',
    category: 'account',
    icon: GraduationCap,
    color: 'green',
    steps: [
      'Completing course requirements',
      'Accessing certificates page',
      'Downloading PDF certificates',
      'Sharing on LinkedIn',
    ],
  },
  // Getting Help
  {
    id: 'contacting-support',
    title: 'Contacting Support',
    description: 'Different ways to get help when you need it.',
    duration: '2:45',
    category: 'support',
    icon: Users,
    color: 'blue',
    steps: [
      'Using live chat',
      'Submitting a support ticket',
      'Calling the support line',
      'Email support options',
    ],
  },
  {
    id: 'troubleshooting-common-issues',
    title: 'Troubleshooting Common Issues',
    description: 'Quick fixes for the most common technical problems.',
    duration: '6:30',
    category: 'support',
    icon: Settings,
    color: 'orange',
    steps: [
      'Login problems',
      'Video playback issues',
      'Assignment upload errors',
      'Browser compatibility',
    ],
  },
];

export default async function TutorialsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
  
  // Fetch tutorials from database
  const { data: dbTutorials } = await db
    .from('tutorials')
    .select('*')
    .eq('published', true)
    .order('order_index');

  const featuredTutorials = tutorials.filter((t) => t.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Help', href: '/help' }, { label: 'Tutorials' }]} />
        </div>
      </div>

      {/* Hero Banner */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/help-page-2.jpg"
          alt="Students learning with video tutorials"
          fill
          className="object-cover"
          quality={90}
          priority
          sizes="100vw"
        />
        
        
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Tutorials */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Most Popular Tutorials
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {featuredTutorials.map((tutorial) => (
              <div
                key={tutorial.id}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-brand-blue-500 hover:shadow-lg transition-all group"
              >
                {/* Video Thumbnail Placeholder */}
                <div className="relative h-48 bg-brand-blue-600 flex items-center justify-center">
                  
                  <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  <div className="absolute bottom-4 right-4 bg-slate-800 text-white text-sm px-2 py-1 rounded">
                    {tutorial.duration}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-brand-blue-100 text-brand-blue-700 text-xs font-medium rounded">
                      {tutorial.category.replace('-', ' ')}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500 text-sm">
                      <Clock className="w-4 h-4" />
                      {tutorial.duration}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-blue-600 transition-colors">
                    {tutorial.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{tutorial.description}</p>
                  <button className="flex items-center gap-2 text-brand-blue-600 font-semibold hover:gap-3 transition-all">
                    Watch Tutorial
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tutorialCategories.map((cat) => (
            <button
              key={cat.id}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                cat.id === 'all'
                  ? 'bg-brand-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* All Tutorials Grid */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6">All Tutorials</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((tutorial) => {
              const colorClasses: Record<string, string> = {
                blue: 'bg-brand-blue-100 text-brand-blue-600',
                green: 'bg-brand-green-100 text-brand-green-600',
                blue: 'bg-brand-blue-100 text-brand-blue-600',
                orange: 'bg-brand-orange-100 text-brand-orange-600',
              };

              return (
                <div
                  key={tutorial.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-brand-blue-300 transition-all group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[tutorial.color]}`}
                    >
                      <tutorial.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-brand-blue-600 transition-colors">
                        {tutorial.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{tutorial.duration}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{tutorial.description}</p>

                  {/* Steps Preview */}
                  <div className="space-y-2 mb-4">
                    {tutorial.steps.slice(0, 3).map((step, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        <span>{step}</span>
                      </div>
                    ))}
                    {tutorial.steps.length > 3 && (
                      <p className="text-sm text-gray-400 pl-6">
                        +{tutorial.steps.length - 3} more steps
                      </p>
                    )}
                  </div>

                  <button className="flex items-center gap-2 text-brand-blue-600 font-medium text-sm hover:gap-3 transition-all">
                    <Play className="w-4 h-4" />
                    Watch Now
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Help CTA */}
        <section className="mt-12">
          <div className="bg-brand-blue-600 rounded-xl p-8 text-white">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-2">Can't Find What You Need?</h2>
              <p className="text-brand-blue-100 mb-6">
                Our support team is available to help you with any questions not covered
                in these tutorials.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-blue-600 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors"
                >
                  Contact Support
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-400 transition-colors"
                >
                  Browse FAQs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
