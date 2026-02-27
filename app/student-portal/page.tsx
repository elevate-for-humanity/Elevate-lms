
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Calendar,
  FileText,
  Users,
  Award,
  TrendingUp,
  Clock,
  Video,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Target,
  BarChart3,
  Mail,
  Phone,
  Download,
  ExternalLink,
  ArrowRight,
  Bell,
  Settings,
  HelpCircle,
  Info,
  AlertTriangle,
CheckCircle, } from 'lucide-react';
import AnnouncementsFeed from './AnnouncementsFeed';
import EnrollmentDashboard from './EnrollmentDashboard';
import StudentProgressWidget from './StudentProgressWidget';

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/student-portal',
  },
  title: 'Student Portal | Elevate For Humanity',
  description:
    'Access your courses, track progress, connect with instructors, view grades, manage your schedule, and access career services. Your complete student dashboard.',
  keywords: ['student portal', 'student dashboard', 'course access', 'grades', 'schedule', 'career services', 'student resources'],
};

export default function StudentPortalPage() {

  const quickLinks = [
    {
      icon: BookOpen,
      title: 'My Courses',
      description: 'Access course materials, lectures, and assignments',
      href: '/lms/courses',
      color: 'blue',
      image: '/images/heroes/student-community.jpg',
    },
    {
      icon: Calendar,
      title: 'Schedule',
      description: 'View class schedule, deadlines, and upcoming events',
      href: '/student-portal/schedule',
      color: 'green',
      image: '/images/heroes/student-courses.jpg',
    },
    {
      icon: BarChart3,
      title: 'Grades & Progress',
      description: 'Track your academic performance and completion status',
      href: '/student-portal/grades',
      color: 'blue',
      image: '/images/heroes/resource-5.jpg',
    },
    {
      icon: Users,
      title: 'Instructors',
      description: 'Connect with instructors and get support',
      href: '/lms/support',
      color: 'orange',
      image: '/images/heroes/student-career.jpg',
    },
    {
      icon: Briefcase,
      title: 'Career Services',
      description: 'Resume help, job placement, and interview prep',
      href: '/career-services',
      color: 'teal',
      image: '/images/heroes/student-progress.jpg',
    },
    {
      icon: FileText,
      title: 'Documents',
      description: 'Transcripts, certificates, and important forms',
      href: '/lms/files',
      color: 'indigo',
      image: '/images/heroes/testimonial-1.jpg',
    },
  ];

  const resources = [
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Step-by-step guides for using the portal and course tools',
      href: '/lms/resources',
    },
    {
      icon: HelpCircle,
      title: 'Student Handbook',
      description: 'Policies, procedures, and important information',
      href: '/student-portal/handbook',
    },
    {
      icon: MessageSquare,
      title: 'Discussion Forums',
      description: 'Connect with classmates and study groups',
      href: '/lms/forums',
    },
    {
      icon: Award,
      title: 'Certifications',
      description: 'View earned credentials and download certificates',
      href: '/lms/certificates',
    },
  ];

  const careerServices = [
    {
      icon: FileText,
      title: 'Resume Building',
      description: 'Professional resume writing and review services',
      href: '/career-services/resume-building',
    },
    {
      icon: Users,
      title: 'Interview Prep',
      description: 'Mock interviews and expert feedback',
      href: '/career-services/interview-prep',
    },
    {
      icon: Briefcase,
      title: 'Job Placement',
      description: 'Direct connections to hiring employers',
      href: '/career-services/job-placement',
    },
    {
      icon: Calendar,
      title: 'Networking Events',
      description: 'Career fairs and industry meetups',
      href: '/career-services/networking-events',
    },
  ];

  const supportOptions = [
    {
      icon: Phone,
      title: 'Call Student Services',
      description: '(317) 314-3757',
      href: 'tel:+13173143757',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'our contact form',
      href: 'mailto:our contact form',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Available Mon-Fri 9AM-6PM EST',
      href: '/contact',
    },
    {
      icon: HelpCircle,
      title: 'Help Center',
      description: 'FAQs and troubleshooting guides',
      href: '/lms/help',
    },
  ];

  // Announcements fetched from database via AnnouncementsFeed component
  // No hardcoded/fake announcements - strict rendering rule

  const faqs = [
    {
      question: 'How do I access my courses?',
      answer:
        'Click "My Courses" from the dashboard. All enrolled courses will appear with direct links to course materials, lectures, and assignments.',
    },
    {
      question: 'Where can I view my grades?',
      answer:
        'Navigate to "Grades & Progress" to see current grades, assignment scores, and overall completion percentage for each course.',
    },
    {
      question: 'How do I contact my instructor?',
      answer:
        'Go to "Instructors" to see contact information, office hours, and messaging options for all your instructors.',
    },
    {
      question: 'Can I download my transcripts?',
      answer:
        'Yes! Visit "Documents" to request official transcripts, download unofficial transcripts, and access certificates.',
    },
    {
      question: 'What career services are available?',
      answer:
        'All students have free access to resume building, interview prep, job placement assistance, and networking events. Click "Career Services" to learn more.',
    },
    {
      question: 'How do I get technical support?',
      answer:
        'Contact student services via phone, email, or live chat. Technical support is available Monday-Friday 9AM-6PM EST.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Student Portal" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/artlist/hero-training-1.jpg"
          alt="Student Portal"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Avatar Guide */}

      {/* My Enrollments - Shows for logged-in users */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <EnrollmentDashboard />
          <StudentProgressWidget />
        </div>
      </section>

      {/* Quick Links Dashboard */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4">Quick Access</h2>
          <p className="text-xl text-gray-600 mb-12">
            Everything you need in one place
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-brand-blue-600 hover:shadow-lg transition group"
              >
                <div className="relative h-36">
                  <Image src={link.image} alt={link.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-black mb-2 group-hover:text-brand-blue-600 transition">
                    {link.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{link.description}</p>
                  <span className="text-brand-blue-600 font-semibold text-sm flex items-center gap-1">
                    Access Now <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements - Database-backed, no fake data */}
      <AnnouncementsFeed />

      {/* Career Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4">
            Career Services
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Free support to help you land your dream job
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {careerServices.map((service, index) => (
              <Link
                key={index}
                href={service.href}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-brand-green-600 transition text-center group"
              >
                <service.icon className="w-12 h-12 text-brand-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-black mb-2 group-hover:text-brand-green-600 transition">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/career-services"
              className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-green-700 transition"
            >
              View All Career Services
              <ExternalLink className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Student Resources */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4">
            Student Resources
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Tools and information to support your success
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource, index) => (
              <Link
                key={index}
                href={resource.href}
                className="bg-white rounded-xl p-6 hover:shadow-lg transition"
              >
                <resource.icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-black mb-2">
                  {resource.title}
                </h3>
                <p className="text-gray-600 text-sm">{resource.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4 text-center">
            Need Help?
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center">
            Student services is here to support you
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportOptions.map((option, index) => (
              <Link
                key={index}
                href={option.href}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-brand-blue-600 transition text-center"
              >
                <option.icon className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-black mb-2">
                  {option.title}
                </h3>
                <p className="text-gray-600 text-sm">{option.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-black mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-6">
            Questions? Contact Us
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Need help with your enrollment, courses, or funding? We&apos;re here for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition"
            >
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pathways"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-blue-800 transition border-2 border-white"
            >
              Browse Pathways
              <BookOpen className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
