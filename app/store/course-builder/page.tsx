export const dynamic = 'force-static';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  BookOpen,
  Layout,
  Video,
  FileText,
  CheckCircle,
  Clock,
  Users,
  Award,
  ArrowRight,
  Play,
  Sparkles,
  Plus,
  GripVertical,
  Type,
  Image,
  MessageSquare,
  FileQuestion,
  PlayCircle,
  ChevronRight,
  Settings,
  BarChart2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Course Builder | Elevate Store',
  description:
    'AI-powered course creation with drag-and-drop lessons, video hosting, quizzes, and instant publishing to your LMS.',
  keywords: ['course builder', 'LMS', 'online courses', 'training platform', 'course creation'],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/course-builder',
  },
};

const blockTypes = [
  { icon: Video, label: 'Video', desc: 'Upload or embed', color: 'bg-red-100 text-red-600' },
  {
    icon: FileText,
    label: 'Lesson',
    desc: 'Rich text content',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: FileQuestion,
    label: 'Quiz',
    desc: 'Multiple choice',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: MessageSquare,
    label: 'Discussion',
    desc: 'Social learning',
    color: 'bg-emerald-100 text-emerald-600',
  },
  { icon: Image, label: 'Image', desc: 'Visual content', color: 'bg-orange-100 text-orange-600' },
  { icon: Type, label: 'Text', desc: 'Plain or markdown', color: 'bg-slate-100 text-slate-600' },
];

const templates = [
  { name: 'New Employee Onboarding', modules: 8, time: '2-3 hours', students: 1247 },
  { name: 'Sales Training Fundamentals', modules: 12, time: '4-6 hours', students: 892 },
  { name: 'Workplace Safety Compliance', modules: 6, time: '1-2 hours', students: 3421 },
  { name: 'Customer Service Excellence', modules: 10, time: '3-4 hours', students: 2156 },
];

const features = [
  {
    icon: Sparkles,
    title: 'AI Course Generation',
    desc: 'Describe your course and AI creates the outline, lessons, and quizzes automatically.',
  },
  {
    icon: Video,
    title: 'Built-in Video Hosting',
    desc: 'Upload videos or embed from YouTube, Vimeo. Automatic transcription and captions.',
  },
  {
    icon: CheckCircle,
    title: 'Interactive Quizzes',
    desc: 'Multiple choice, true/false, fill-in-the-blank. Auto-grading with detailed feedback.',
  },
  {
    icon: BarChart2,
    title: 'Progress Tracking',
    desc: 'See exactly where each student is. Time spent, quiz scores, completion rates.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Multiple instructors can create and edit courses. Version history included.',
  },
  {
    icon: Award,
    title: 'Certificates',
    desc: 'Auto-generate certificates when students complete courses. Custom branding.',
  },
];

export default function CourseBuilderPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Course Builder' }]} />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-900" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-72 h-72 bg-pink-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-blue-400 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-bold mb-6">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                AI-Powered Creation
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                Course Builder
                <span className="block text-brand-blue-200">Create Courses in Minutes</span>
              </h1>

              <p className="text-xl text-blue-100 mb-8">
                Build professional training courses with drag-and-drop lessons, video hosting,
                quizzes, and certificates. AI generates content from your descriptions.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/admin/courses/new"
                  className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  Create Your First Course
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/store/course-builder#preview"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-bold px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Preview Builder
                </Link>
              </div>
            </div>

            {/* Course Builder Preview */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-xs text-slate-500 ml-2">Course Builder</span>
              </div>

              <div className="flex">
                {/* Sidebar */}
                <div className="w-48 bg-slate-50 p-3 border-r border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Modules</p>
                  {['Introduction', 'Core Concepts', 'Practical Exercises', 'Assessment'].map(
                    (m, i) => (
                      <div
                        key={m}
                        className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm mb-1 ${i === 1 ? 'bg-brand-blue-100 text-brand-blue-700' : 'text-slate-700'}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                        {m}
                      </div>
                    ),
                  )}
                  <button className="flex items-center gap-2 px-2 py-2 text-sm text-brand-blue-600 mt-2">
                    <Plus className="w-4 h-4" />
                    Add Module
                  </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Module 2: Core Concepts</h3>
                    <button className="text-xs px-2 py-1 bg-brand-blue-100 text-brand-blue-700 rounded">
                      Preview
                    </button>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        icon: Video,
                        type: 'Video Lesson',
                        time: '12:34',
                        color: 'bg-red-100 text-red-600',
                      },
                      {
                        icon: FileText,
                        type: 'Reading',
                        time: '5 min',
                        color: 'bg-blue-100 text-blue-600',
                      },
                      {
                        icon: FileQuestion,
                        type: 'Quiz',
                        time: '10 Q',
                        color: 'bg-purple-100 text-purple-600',
                      },
                    ].map((lesson, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <GripVertical className="w-4 h-4 text-slate-400" />
                        <div
                          className={`w-8 h-8 ${lesson.color} rounded-lg flex items-center justify-center`}
                        >
                          <lesson.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{lesson.type}</p>
                          <p className="text-xs text-slate-500">{lesson.time}</p>
                        </div>
                        <Settings className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>

                  <button className="flex items-center gap-2 text-sm text-brand-blue-600 mt-4">
                    <Plus className="w-4 h-4" />
                    Add Content Block
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Block Types */}
      <section id="preview" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Content Blocks</h2>
            <p className="text-slate-600">Drag and drop any content type into your course</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {blockTypes.map((block) => (
              <div
                key={block.label}
                className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow cursor-pointer"
              >
                <div
                  className={`w-12 h-12 ${block.color} rounded-xl flex items-center justify-center mx-auto mb-3`}
                >
                  <block.icon className="w-6 h-6" />
                </div>
                <p className="font-semibold text-slate-900 text-sm">{block.label}</p>
                <p className="text-xs text-slate-500">{block.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Generation */}
      <section className="py-16 px-4 bg-brand-blue-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue-100 text-brand-blue-700 rounded-full text-sm font-bold mb-4">
                <Sparkles className="w-4 h-4" />
                AI Assistant
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Create Courses with AI</h2>
              <p className="text-lg text-slate-600 mb-6">
                Describe your training topic and AI generates a complete course structure with
                lessons, quizzes, and practical exercises.
              </p>

              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-brand-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      What can I create for you?
                    </p>
                    <p className="text-xs text-slate-500">
                      Describe your course topic or upload content
                    </p>
                  </div>
                </div>
                <textarea
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                  rows={3}
                  placeholder="e.g., A 6-module course on customer service fundamentals for retail employees, including video lessons and quizzes..."
                />
                <button className="mt-3 w-full bg-brand-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-brand-blue-700 transition-colors">
                  Generate Course with AI
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <p className="text-sm font-semibold text-slate-900 mb-4">AI will create:</p>
              <ul className="space-y-3">
                {[
                  'Course outline with modules',
                  'Lesson content for each section',
                  'Interactive quiz questions',
                  'Practical exercises',
                  'Final assessment',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  AI generates content based on best practices. You can edit, add, or remove any
                  content before publishing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Built for Professional Training
            </h2>
            <p className="text-lg text-slate-600">Everything you need to create engaging courses</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{f.title}</h3>
                    <p className="text-sm text-slate-600">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Course Templates */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Start with a Template</h2>
            <p className="text-lg text-slate-600">
              Pre-built courses you can customize or use as-is
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {templates.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{t.name}</h3>
                    <p className="text-sm text-slate-500">
                      {t.students.toLocaleString()} students enrolled
                    </p>
                  </div>
                  <BookOpen className="w-8 h-8 text-brand-blue-100" />
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Layout className="w-4 h-4" />
                    {t.modules} modules
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {t.time}
                  </span>
                </div>
                <button className="text-sm text-brand-blue-600 font-semibold hover:text-brand-blue-700">
                  Preview Template →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Course Builder is Included</h2>
          <p className="text-lg text-slate-600 mb-8">
            Available with all Elevate Platform Professional and Enterprise plans. Also available as
            a standalone add-on.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Add-on</h3>
              <p className="text-slate-600 mb-4">Standalone access to Course Builder</p>
              <p className="text-4xl font-bold text-slate-900 mb-6">
                $29<span className="text-lg font-normal text-slate-500">/mo</span>
              </p>
              <ul className="text-left space-y-2 mb-6">
                {[
                  'Unlimited courses',
                  'AI content generation',
                  'Video hosting',
                  'Certificates',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/store/checkout/course-builder"
                className="block text-center bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Add to Plan
              </Link>
            </div>

            <div className="bg-brand-blue-900 rounded-2xl p-8 text-white">
              <h3 className="text-xl font-bold mb-2">Platform Bundle</h3>
              <p className="text-blue-200 mb-4">Full LMS with Course Builder included</p>
              <p className="text-4xl font-bold mb-6">
                $99<span className="text-lg font-normal text-blue-300">/mo</span>
              </p>
              <ul className="text-left space-y-2 mb-6">
                {[
                  'Everything in Add-on',
                  'Student management',
                  'Enrollment forms',
                  'Reporting dashboard',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-blue-100">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/store/plans"
                className="block text-center bg-white text-brand-blue-900 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors"
              >
                View All Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <BookOpen className="w-12 h-12 text-brand-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Start creating courses today</h2>
          <p className="text-slate-400 mb-8">Free trial. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin/courses/new"
              className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Create Your First Course
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact?subject=Course+Builder+Demo"
              className="inline-flex items-center gap-2 border border-slate-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
