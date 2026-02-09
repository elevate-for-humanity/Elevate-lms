import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Heart, Users, BookOpen, Award, Target, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About | Elevate Hub',
  description: 'Learn about the Elevate community and our mission.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Hub", href: "/hub" }, { label: "About" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-2xl mb-6">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome to Elevate Hub</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            A community of learners, mentors, and professionals committed to growth and success.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed">
            Elevate for Humanity exists to break down barriers to career advancement. We believe everyone 
            deserves access to quality education, supportive community, and pathways to meaningful employment. 
            Through our platform, we connect learners with funded training programs, industry certifications, 
            and a network of peers and mentors who are invested in their success.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Community First</h3>
            <p className="text-slate-600">
              Learning is better together. Our community supports each other through study groups, 
              peer mentoring, and celebrating wins.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Quality Education</h3>
            <p className="text-slate-600">
              Industry-aligned curriculum, expert instructors, and hands-on training that 
              prepares you for real-world success.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Outcome Focused</h3>
            <p className="text-slate-600">
              We measure success by your success. Job placement, career advancement, and 
              financial stability are our goals.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Accessible to All</h3>
            <p className="text-slate-600">
              Through WIOA funding, grants, and scholarships, we work to ensure cost is never 
              a barrier to your education.
            </p>
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Community Guidelines</h2>
          <ul className="space-y-3 text-slate-600">
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">1.</span>
              <span><strong>Be Respectful</strong> - Treat all members with kindness and respect.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">2.</span>
              <span><strong>Stay On Topic</strong> - Keep discussions relevant to learning and career growth.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">3.</span>
              <span><strong>Help Others</strong> - Share your knowledge and support fellow learners.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">4.</span>
              <span><strong>No Spam</strong> - Avoid self-promotion and irrelevant content.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">5.</span>
              <span><strong>Protect Privacy</strong> - Don&apos;t share personal information without consent.</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="bg-green-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-green-100 mb-6">
            Join thousands of learners who are transforming their careers.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link 
              href="/hub" 
              className="px-6 py-3 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50"
            >
              Enter Community
            </Link>
            <Link 
              href="/programs" 
              className="px-6 py-3 bg-green-600 text-white border-2 border-white rounded-lg font-medium hover:bg-green-700"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
