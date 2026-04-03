import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Award, BarChart3, Users, Play, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Learning Management System | Elevate For Humanity',
  description: 'Access your courses, track progress, earn certificates, and advance your career with our online learning platform.',
};

export default function LMSPortalPublicPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Learning Portal' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-900 to-brand-blue-700 text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-6 text-brand-blue-300" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Learning Management System</h1>
          <p className="text-xl text-white max-w-2xl mx-auto mb-8">
            Access your courses, track your progress, and earn industry-recognized certifications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login?redirect=/lms"
              className="inline-flex items-center gap-2 bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-blue-50 transition-colors"
            >
              Sign In to LMS
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Your Learning Journey</h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
            Everything you need to succeed in your career training program.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6">
              <Play className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Video Courses</h3>
              <p className="text-slate-600">Professional video lessons and interactive content with instructor oversight and progress checkpoints.</p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <BarChart3 className="w-10 h-10 text-brand-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Progress Tracking</h3>
              <p className="text-slate-600">Monitor your progress, see completion rates, and stay on track with your goals.</p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <Award className="w-10 h-10 text-amber-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Certificates</h3>
              <p className="text-slate-600">Earn industry-recognized certificates upon completing your training programs.</p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <Users className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Community</h3>
              <p className="text-slate-600">Connect with fellow students, join study groups, and participate in forums.</p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <h3 className="text-xl font-bold mb-2">Assessments</h3>
              <p className="text-slate-600">Test your knowledge with quizzes and practical assessments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-white mb-6">Enroll in a program today and begin your career transformation.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-white transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
