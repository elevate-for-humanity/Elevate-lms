import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { 
  BookOpen, 
  Award, 
  Calendar, 
  MessageSquare, 
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Play,
  FileText,
  Bell,
  Smartphone,
  ChevronRight
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/student-portal',
  },
  title: 'Student Portal | Elevate For Humanity LMS Platform',
  description: 'Access your personalized learning dashboard, track progress, complete assignments, earn certificates, and connect with instructors through our student portal.',
};

const PORTAL_FEATURES = [
  {
    icon: BookOpen,
    title: 'Course Library',
    description: 'Access all your enrolled courses, video lessons, reading materials, and interactive content in one organized dashboard.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description: 'Monitor your learning progress with visual dashboards showing completed lessons, quiz scores, and time spent learning.',
  },
  {
    icon: Award,
    title: 'Certificates & Badges',
    description: 'Earn verifiable digital certificates and achievement badges as you complete courses and reach milestones.',
  },
  {
    icon: Calendar,
    title: 'Schedule Management',
    description: 'View upcoming classes, assignment deadlines, exam dates, and sync everything with your personal calendar.',
  },
  {
    icon: MessageSquare,
    title: 'AI Tutor Support',
    description: 'Get instant help from our AI tutor available 24/7 to answer questions and explain difficult concepts.',
  },
  {
    icon: Users,
    title: 'Community Forums',
    description: 'Connect with fellow students, join study groups, share resources, and participate in discussions.',
  },
];

const DASHBOARD_SECTIONS = [
  { name: 'My Courses', description: 'View and continue your enrolled courses', href: '/lms/courses' },
  { name: 'Assignments', description: 'Track and submit your assignments', href: '/lms/assignments' },
  { name: 'Grades', description: 'View your grades and academic progress', href: '/lms/grades' },
  { name: 'Certificates', description: 'Download your earned certificates', href: '/lms/certificates' },
  { name: 'Calendar', description: 'See upcoming deadlines and events', href: '/lms/calendar' },
  { name: 'AI Tutor', description: 'Get help with your coursework', href: '/lms/ai-tutor' },
];

export default function StudentPortalPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10" />
          <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <BookOpen className="w-4 h-4" />
                  <span>Learning Management System</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
                  Student Portal
                </h1>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Your personalized learning hub. Access courses, track progress, complete assignments, 
                  earn certificates, and connect with instructors—all from one powerful dashboard.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/lms/dashboard"
                    className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg"
                  >
                    <Play className="w-5 h-5" />
                    Go to Dashboard
                  </Link>
                  <Link
                    href="/apply"
                    className="inline-flex items-center gap-2 bg-blue-500/30 backdrop-blur text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-500/40 transition border border-white/30"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/heroes/student-dashboard.jpg"
                    alt="Student Portal Dashboard"
                    fill
                    className="object-cover"
                    sizes="50vw"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Our student portal provides all the tools and resources you need to complete your training 
                and launch your career.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {PORTAL_FEATURES.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition"
                  >
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                      <IconComponent className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
                  Your Learning Dashboard
                </h2>
                <p className="text-lg text-slate-600 mb-8">
                  Access everything from one intuitive dashboard. Track your progress, manage assignments, 
                  view grades, and stay on top of deadlines.
                </p>
                
                <div className="space-y-4">
                  {DASHBOARD_SECTIONS.map((section) => (
                    <Link
                      key={section.name}
                      href={section.href}
                      className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition group"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {section.name}
                        </h4>
                        <p className="text-sm text-slate-600">{section.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/heroes/student-courses.jpg"
                  alt="Student Dashboard"
                  fill
                  className="object-cover"
                  sizes="50vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Access */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-12 text-white">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-medium mb-6">
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile Friendly</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black mb-6">
                    Learn Anywhere, Anytime
                  </h2>
                  <p className="text-xl text-indigo-100 mb-8">
                    Access your courses on any device. Our responsive platform works seamlessly on 
                    desktop, tablet, and mobile so you can learn on your schedule.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span>Offline access</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span>Video downloads</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span>Push notifications</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span>Progress sync</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative w-64 h-[500px]">
                    <div className="absolute inset-0 bg-white/10 rounded-[3rem] backdrop-blur" />
                    <div className="absolute inset-4 bg-slate-900 rounded-[2.5rem] overflow-hidden">
                      <Image
                        src="/images/heroes/student-profile.jpg"
                        alt="Mobile App"
                        fill
                        className="object-cover"
                        sizes="256px"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Ready to Start Learning?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of students who are building their careers through our training programs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-slate-100 transition"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
