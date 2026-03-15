import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Monitor, Users, Calendar, ArrowRight, Clock } from 'lucide-react';
import { getVideosByCategory } from '@/lib/video/registry';

export const metadata: Metadata = {
  title: 'Product Demos | Elevate For Humanity',
  description: 'See our training platform in action. Watch demos of the LMS, employer portal, and admin dashboard.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/demos',
  },
};

const demos = [
  {
    id: 'demo-lms-overview',
    title: 'LMS Platform Overview',
    description: 'See how students navigate courses, track progress, earn certificates, and interact with AI tutors.',
    duration: '15 min',
    thumbnail: '/images/pages/tech-classroom.jpg',
    features: [
      'Student dashboard walkthrough',
      'Course enrollment and navigation',
      'Quiz and assessment system',
      'Certificate generation',
      'AI tutor interaction',
    ],
    videoUrl: '/videos/hero-home.mp4',
    demoUrl: '/demo',
    status: 'available' as const,
  },
  {
    id: 'demo-employer-portal',
    title: 'Employer Portal Demo',
    description: 'Learn how employers track sponsored employees, post jobs, and access workforce analytics.',
    duration: '10 min',
    thumbnail: '/images/pages/features-hero.jpg',
    features: [
      'Candidate search and filtering',
      'Job posting workflow',
      'Employee progress tracking',
      'OJT funding management',
      'Analytics and reports',
    ],
    videoUrl: '/videos/hero-home.mp4',
    demoUrl: '/employer-portal',
    status: 'available' as const,
  },
  {
    id: 'demo-admin-dashboard',
    title: 'Admin Dashboard Tour',
    description: 'Explore the administrative tools for managing programs, students, courses, and compliance.',
    duration: '20 min',
    thumbnail: '/images/pages/workforce-training.jpg',
    features: [
      'Student management',
      'Course builder and authoring',
      'Enrollment and payments',
      'Compliance tracking',
      'Reports and analytics',
    ],
    videoUrl: '/videos/hero-home.mp4',
    demoUrl: '/admin',
    status: 'available' as const,
  },
  {
    id: 'demo-course-builder',
    title: 'AI Course Builder',
    description: 'Watch how to create complete courses with AI-generated content, quizzes, and video lessons.',
    duration: '12 min',
    thumbnail: '/images/pages/philanthropy-hero.jpg',
    features: [
      'AI course generation',
      'Drag-and-drop lesson builder',
      'Quiz and assessment creation',
      'Video lesson integration',
      'SCORM import support',
    ],
    videoUrl: '/videos/hero-home.mp4',
    demoUrl: '/ai-studio',
    status: 'available' as const,
  },
];

export default function DemosPage() {
  // Get any live demo videos from registry
  const registryDemos = getVideosByCategory('Demo');

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Demos" }]} />
      </div>
{/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/images/pages/demos-hero.jpg" alt="Product Demos" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">See Elevate in Action</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Watch demos of our training platform or schedule a personalized walkthrough with our team. See how we help organizations train their workforce.</p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-4 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/videos" className="px-4 py-2 bg-brand-orange-100 text-brand-orange-800 rounded-full text-sm font-medium hover:bg-brand-orange-200 transition-colors">
              Training Videos
            </Link>
            <Link href="/webinars" className="px-4 py-2 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-medium hover:bg-brand-blue-200 transition-colors">
              Webinars
            </Link>
            <Link href="/testimonials" className="px-4 py-2 bg-brand-green-100 text-brand-green-800 rounded-full text-sm font-medium hover:bg-brand-green-200 transition-colors">
              Success Stories
            </Link>
            <Link href="/store" className="px-4 py-2 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-medium hover:bg-brand-blue-200 transition-colors">
              Platform Store
            </Link>
          </div>
        </div>
      </section>

      {/* Demos Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Platform Demos
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our platform capabilities through these detailed walkthroughs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {demos.map((demo) => (
              <div 
                key={demo.id} 
                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-brand-blue-300 hover:shadow-xl transition-all"
              >
                {/* Thumbnail */}
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={demo.thumbnail}
                    alt={demo.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                    <Link 
                      href={demo.demoUrl}
                      className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Play className="w-10 h-10 text-brand-blue-600 ml-1" />
                    </Link>
                  </div>
                  <div className="absolute top-4 right-4 bg-white text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {demo.duration}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{demo.title}</h3>
                  <p className="text-gray-600 mb-4">{demo.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    {demo.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-slate-500 flex-shrink-0">•</span>
                        {feature}
                      </div>
                    ))}
                    {demo.features.length > 3 && (
                      <p className="text-sm text-gray-500 pl-6">
                        +{demo.features.length - 3} more features
                      </p>
                    )}
                  </div>

                  <Link
                    href={demo.demoUrl}
                    className="block w-full py-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center rounded-lg font-semibold transition-colors"
                  >
                    Try Demo
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo CTA */}
      <section className="py-20 bg-white text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Users className="w-16 h-16 mx-auto mb-6 text-brand-blue-300" />
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Want a Personalized Demo?
          </h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Schedule a live walkthrough with our team to see how Elevate can work 
            for your organization. We&apos;ll customize the demo to your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?type=demo"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-900 px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-50 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Schedule Demo
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 transition-colors border border-brand-blue-500"
            >
              Call (317) 314-3757
            </a>
          </div>
        </div>
      </section>

      {/* What You'll See */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What You&apos;ll See in a Live Demo
            </h2>
            <p className="text-gray-600">
              Our team will walk you through the entire platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Monitor className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Student Experience</h3>
              <p className="text-gray-600 text-sm">
                See how students enroll, take courses, complete assessments, and earn certificates.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-brand-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Admin Tools</h3>
              <p className="text-gray-600 text-sm">
                Explore course creation, student management, reporting, and compliance features.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <ArrowRight className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Integration Options</h3>
              <p className="text-gray-600 text-sm">
                Learn about API integrations, SSO, SCORM support, and white-label options.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
