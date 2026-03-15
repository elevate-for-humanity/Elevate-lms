import Link from 'next/link';
import {
  Brain,
  MessageSquare,
  Sparkles,
  Target,
  BookOpen,
  Briefcase,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata = {
  title: 'AI-Powered Learning Tools | Elevate for Humanity',
  description:
    'Get 24/7 help with AI tutoring, course building, job matching, and more. Powered by advanced AI to accelerate your learning.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/ai',
  },
};

export default function AIHubPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'AI Tools' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-white  via-white  py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-100 text-brand-blue-900 rounded-full text-sm font-bold mb-6">
            <Brain className="w-4 h-4" />
            AI-Powered Learning
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-black mb-6">
            Learn Faster with AI
          </h1>

          <p className="text-xl text-black max-w-3xl mx-auto">
            Get instant help, build courses automatically, match to jobs, and
            more. Our AI tools are available 24/7 to accelerate your learning
            journey.
          </p>
        </div>
      </section>

      {/* AI Tools Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Tutor */}
            <Link
              href="/ai-tutor"
              className="group bg-zinc-900   rounded-2xl p-8 border-2 border-brand-blue-200 hover:border-brand-blue-400 hover:shadow-xl transition-all"
            >
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">
                AI Tutor
              </h3>
              <p className="text-black mb-4">
                Get instant answers to your questions. Available 24/7 to help
                you understand course material, solve problems, and learn
                faster.
              </p>
              <div className="flex items-center gap-2 text-brand-blue-600 font-semibold group-hover:gap-4 transition-all">
                <span>Start Learning</span>
                <span>→</span>
              </div>
              <div className="mt-6 pt-6 border-t border-brand-blue-200">
                <div className="flex items-center gap-2 text-sm text-black">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span>Most Popular</span>
                </div>
              </div>
            </Link>

            {/* AI Chat */}
            <Link
              href="/ai-chat"
              className="group bg-zinc-900   rounded-2xl p-8 border-2 border-brand-green-200 hover:border-brand-green-400 hover:shadow-xl transition-all"
            >
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">
                AI Chat Assistant
              </h3>
              <p className="text-black mb-4">
                Have a conversation with AI about your career goals, training
                options, and next steps. Get personalized guidance instantly.
              </p>
              <div className="flex items-center gap-2 text-brand-green-600 font-semibold group-hover:gap-4 transition-all">
                <span>Start Chatting</span>
                <span>→</span>
              </div>
            </Link>

            {/* AI Course Builder */}
            <Link
              href="/ai"
              className="group bg-zinc-900   rounded-2xl p-8 border-2 border-brand-blue-200 hover:border-brand-blue-400 hover:shadow-xl transition-all"
            >
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">
                AI Course Builder
              </h3>
              <p className="text-black mb-4">
                Create complete training courses in minutes. AI generates
                outlines, lessons, quizzes, and materials automatically.
              </p>
              <div className="flex items-center gap-2 text-brand-blue-600 font-semibold group-hover:gap-4 transition-all">
                <span>Build Course</span>
                <span>→</span>
              </div>
              <div className="mt-6 pt-6 border-t border-brand-blue-200">
                <div className="flex items-center gap-2 text-sm text-black">
                  <Target className="w-4 h-4 text-brand-orange-500" />
                  <span>For Instructors</span>
                </div>
              </div>
            </Link>

            {/* AI Job Matcher */}
            <Link
              href="/ai/job-match"
              className="group bg-zinc-900   rounded-2xl p-8 border-2 border-brand-orange-200 hover:border-brand-orange-400 hover:shadow-xl transition-all"
            >
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">
                AI Job Matcher
              </h3>
              <p className="text-black mb-4">
                Find jobs that match your skills and training. AI analyzes your
                profile and recommends the best opportunities.
              </p>
              <div className="flex items-center gap-2 text-brand-orange-600 font-semibold group-hover:gap-4 transition-all">
                <span>Find Jobs</span>
                <span>→</span>
              </div>
            </Link>

            {/* AI Instructor */}
            <Link
              href="/ai"
              className="group bg-zinc-900   rounded-2xl p-8 border-2 border-pink-200 hover:border-pink-400 hover:shadow-xl transition-all"
            >
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">
                AI Instructor
              </h3>
              <p className="text-black mb-4">
                Virtual instructor that teaches concepts, provides examples, and
                adapts to your learning style.
              </p>
              <div className="flex items-center gap-2 text-pink-600 font-semibold group-hover:gap-4 transition-all">
                <span>Start Learning</span>
                <span>→</span>
              </div>
            </Link>

            {/* AI Asset Generator */}
            <Link
              href="/ai"
              className="group bg-zinc-900   rounded-2xl p-8 border-2 border-teal-200 hover:border-teal-400 hover:shadow-xl transition-all"
            >
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">
                AI Asset Generator
              </h3>
              <p className="text-black mb-4">
                Generate images, diagrams, and visual content for your courses
                and presentations automatically.
              </p>
              <div className="flex items-center gap-2 text-teal-600 font-semibold group-hover:gap-4 transition-all">
                <span>Generate Assets</span>
                <span>→</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            How AI Helps You Learn
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-brand-blue-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Ask Questions
              </h3>
              <p className="text-black">
                Type your question in plain English. No need to search through
                materials.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-brand-green-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Get Instant Answers
              </h3>
              <p className="text-black">
                AI analyzes your course content and provides accurate, helpful
                responses.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-brand-blue-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Learn Faster
              </h3>
              <p className="text-black">
                Understand concepts quickly and move through your training
                with AI-assisted support between instructor sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white   text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Learn with AI?</h2>
          <p className="text-xl opacity-90 mb-8">
            All AI tools are included with your enrollment. Start using them
            today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ai-tutor"
              className="px-8 py-4 bg-white text-brand-blue-600 font-bold rounded-lg hover:bg-white transition-colors"
            >
              Try AI Tutor Now
            </Link>
            <Link
              href="/start"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
            >
              Enroll in Training
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
