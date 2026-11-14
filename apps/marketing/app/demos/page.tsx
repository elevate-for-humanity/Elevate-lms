export const dynamic = 'force-static';


import { Metadata } from 'next';
import Link from 'next/link';
import { Monitor, User, Building2, GraduationCap, Users, Play, Shield, Clock, CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Request a Demo',
  description: 'See Elevate workforce development platform in action. Demo admin, student, employer, and host shop dashboards with sandbox data.',
  keywords: ['workforce demo', 'LMS demo', 'apprenticeship platform demo', 'training management system'],
  robots: { index: false, follow: false },
};

const DEMO_TYPES = [
  {
    id: 'admin',
    title: 'Admin Dashboard',
    description: 'Full platform management. Students, programs, payments, reporting, and integrations.',
    icon: Building2,
    color: 'bg-purple-600',
    features: [
      'Student enrollment management',
      'Program configuration',
      'Payment tracking',
      'Advanced reporting',
      'API integrations',
      'User permissions',
    ],
    demoMode: 'Role-scoped Admin sandbox',
  },
  {
    id: 'student',
    title: 'Student Experience',
    description: 'What students see when they log in. Course progress, assignments, and certifications.',
    icon: User,
    color: 'bg-blue-600',
    features: [
      'Course enrollment',
      'Lesson progress tracking',
      'Assignment submission',
      'Certificate downloads',
      'Payment status',
      'Career resources',
    ],
    demoMode: 'Role-scoped learner sandbox',
  },
  {
    id: 'employer',
    title: 'Employer Portal',
    description: 'Manage apprenticeships, track OJL hours, and connect with training partners.',
    icon: Users,
    color: 'bg-green-600',
    features: [
      'Apprentice tracking',
      'OJL hour management',
      'Competency verification',
      'Performance reports',
      'Compliance documents',
      'Job placement tools',
    ],
    demoMode: 'Role-scoped employer sandbox',
  },
  {
    id: 'host-shop',
    title: 'Host Shop Portal',
    description: 'Barbershops, salons, and training sites track RTI hours and apprentice progress.',
    icon: GraduationCap,
    color: 'bg-orange-600',
    features: [
      'Apprentice management',
      'RTI hour tracking',
      'Syllabus monitoring',
      'Clock in/out approval',
      'Competency sign-offs',
      'Communication hub',
    ],
    demoMode: 'Role-scoped Host Shop sandbox',
  },
  {
    id: 'lms',
    title: 'LMS / Course Builder',
    description: 'Create courses, lessons, quizzes, and manage the entire learning experience.',
    icon: Monitor,
    color: 'bg-teal-600',
    features: [
      'Course builder',
      'Module creation',
      'Quiz builder',
      'Progress tracking',
      'Completion certificates',
      'SCORM support',
    ],
    demoMode: 'Role-scoped Course Builder sandbox',
  },
];

const LIVE_DEMOS = [
  {
    title: 'Workforce Agency Demo',
    description: 'Complete walkthrough for workforce development agencies. See WIOA tracking, participant management, and outcome reporting.',
    duration: '30 min',
    audience: 'Government & Workforce',
  },
  {
    title: 'Training Provider Demo',
    description: 'For schools, colleges, and career centers. LMS integration, accreditation tracking, and student success stories.',
    duration: '45 min',
    audience: 'Education',
  },
  {
    title: 'Apprenticeship Demo',
    description: 'Host shops, employers, and apprentices. RTI hours, competency tracking, and compliance management.',
    duration: '30 min',
    audience: 'Beauty & Trades',
  },
  {
    title: 'Enterprise Demo',
    description: 'Full platform deep dive. API access, white-label options, and custom integrations for large organizations.',
    duration: '60 min',
    audience: 'Enterprise',
  },
];

export default function DemosPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
            <Play className="w-4 h-4" />
            <span>Interactive Demo Environment</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            See Elevate in Action
          </h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto mb-8">
            Explore role-scoped dashboards and workflows with protected sandbox data.
            No shared credentials and no commitment required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#sandbox" className="bg-white text-purple-900 font-bold py-3 px-6 rounded-lg hover:bg-purple-50 flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Explore Demo Options
            </a>
            <Link href="#live-demo" className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-500 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Schedule Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Full sandbox data included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Time-limited role access</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>GDPR compliant demo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sandbox Demo Section */}
      <section id="sandbox" className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Interactive Sandbox Demos</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Choose the dashboard you want to see. We issue protected,
              time-limited access so one public password never unlocks multiple roles.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEMO_TYPES.map((demo) => {
              const Icon = demo.icon;
              return (
                <div key={demo.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`${demo.color} p-4 text-white`}>
                    <div className="flex items-center gap-3">
                      <Icon className="w-8 h-8" />
                      <h3 className="text-lg font-bold">{demo.title}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-slate-600 text-sm mb-4">{demo.description}</p>
                    
                    <div className="space-y-2 mb-6">
                      {demo.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs">
                      <p className="font-medium text-slate-700 mb-1">Protected demo access</p>
                      <p className="text-slate-600">{demo.demoMode}</p>
                      <p className="text-slate-600">No shared or public passwords.</p>
                    </div>

                    <Link 
                      href={`/contact?type=demo&portal=${demo.id}`}
                      className="block w-full bg-slate-900 text-white text-center py-2 px-4 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
                    >
                      Request Demo Access
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 text-center">
            <p className="text-slate-700 font-medium">
              <strong>Need multiple roles?</strong> Tell us which workflows you want to compare and we will provision separate, least-privilege demo access.
            </p>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="live-demo" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Schedule a Live Demo</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Get a personalized walkthrough with our team. We&apos;ll tailor the demo to your specific use case and answer all your questions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {LIVE_DEMOS.map((demo) => (
              <div key={demo.title} className="bg-white rounded-xl border border-slate-200 p-6 hover:border-purple-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      {demo.audience}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">{demo.title}</h3>
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {demo.duration}
                  </div>
                </div>
                <p className="text-slate-600 text-sm mb-4">{demo.description}</p>
                <Link 
                  href="/contact?type=demo" 
                  className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700"
                >
                  Schedule <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">Need a custom demo for your organization&apos;s specific requirements?</p>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700">
              Contact Sales <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Features */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What You&apos;ll See in the Demo</h2>
            <p className="text-slate-300">Real-world workflows, not a PowerPoint presentation</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                Complete Student Journey
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Application to enrollment</li>
                <li>• Digital binder completion</li>
                <li>• Course progress tracking</li>
                <li>• Attendance management</li>
                <li>• Certification & job placement</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                Admin Operations
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Dashboard with key metrics</li>
                <li>• Student & cohort management</li>
                <li>• Payment tracking</li>
                <li>• Compliance reporting</li>
                <li>• API integrations</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                Partner Ecosystem
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Host shop management</li>
                <li>• Employer apprenticeship portal</li>
                <li>• Testing center operations</li>
                <li>• Workforce agency tracking</li>
                <li>• Success outcome reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-purple-700 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-purple-100 mb-8">
            Try the sandbox demo now or schedule time with our team for a personalized walkthrough.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#sandbox" className="bg-white text-purple-900 font-bold py-3 px-6 rounded-lg hover:bg-purple-50">
              Try Sandbox Now
            </a>
            <Link href="/contact?type=demo" className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-500 border border-purple-500">
              Schedule Live Demo
            </Link>
            <Link href="/pricing" className="bg-transparent text-white font-bold py-3 px-6 rounded-lg hover:bg-white/10 border border-white/30">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
