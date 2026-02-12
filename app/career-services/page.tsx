import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Briefcase,
  FileText,
  Users,
  Target,
  CheckCircle,
  ArrowRight,
  MapPin,
  DollarSign,
  Building,
  Clock,
  Calendar,
  Handshake,
  TrendingUp,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Career Services | Elevate For Humanity',
  description: 'Resume building, interview prep, job placement assistance, and career coaching to help you land your dream job.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/career-services',
  },
};

export const dynamic = 'force-dynamic';

const SERVICES = [
  {
    title: 'Resume Building',
    description: 'Professional resume writing and optimization to highlight your skills and experience. Get ATS-optimized resumes that get noticed.',
    image: '/images/business/customer-service.jpg',
    href: '/career-services/resume-building',
    features: ['Professional formatting', 'ATS optimization', 'Cover letter help'],
  },
  {
    title: 'Interview Preparation',
    description: 'Mock interviews, coaching, and strategies to help you ace any interview. Practice with real scenarios.',
    image: '/images/healthcare/hero-program-medical-assistant.jpg',
    href: '/career-services/interview-prep',
    features: ['Mock interviews', 'Feedback sessions', 'Industry-specific prep'],
  },
  {
    title: 'Job Placement',
    description: 'Direct connections to employers actively hiring in your field. We match you with opportunities.',
    image: '/images/heroes-hq/career-services-hero.jpg',
    href: '/career-services/job-placement',
    features: ['Employer network', 'Job matching', '90-day support'],
  },
  {
    title: 'Career Counseling',
    description: 'One-on-one guidance to help you navigate your career path and make informed decisions.',
    image: '/images/testimonials-hq/person-5.jpg',
    href: '/career-services/career-counseling',
    features: ['Career assessment', 'Goal setting', 'Action planning'],
  },
  {
    title: 'Networking Events',
    description: 'Connect with employers, industry professionals, and fellow job seekers at our career events.',
    image: '/images/heroes-hq/about-hero.jpg',
    href: '/career-services/networking-events',
    features: ['Job fairs', 'Industry meetups', 'Alumni network'],
  },
  {
    title: 'Ongoing Support',
    description: 'We don\'t stop when you get hired. Get continued support for career growth and advancement.',
    image: '/images/healthcare/hero-program-patient-care.jpg',
    href: '/career-services/ongoing-support',
    features: ['90-day check-ins', 'Career advancement', 'Skill development'],
  },
];

export default async function CareerServicesPage() {
  const supabase = await createClient();

  // Fetch job postings from database
  const { data: jobs, error } = await supabase
    .from('job_postings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    console.error('Error fetching jobs:', error.message);
  }

  const jobList = jobs || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative">
        <div className="relative h-[450px] bg-gray-900">
          <Image
            src="/images/heroes-hq/career-services-hero.jpg"
            alt="Career Services - Job Placement and Career Support"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          
          
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  <TrendingUp className="w-4 h-4" />
                  Career Services Included
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                  Your Career<br />Starts Here
                </h1>
                <p className="text-xl text-white/90 mb-8">
                  From resume building to job placement, we're with you every step. 
                  We don't just train you—we help you get hired.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/career-services/job-placement"
                    className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition"
                  >
                    Browse Jobs <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/apply"
                    className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
                  >
                    Start Training
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="max-w-6xl mx-auto px-4 text-white">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-4">
              Free for Program Participants
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Career Services</h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mb-8">
              Resume building, interview prep, and job placement support to launch your new career.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-bold text-lg transition-colors"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/career-services/job-placement"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 font-semibold text-lg border border-white/30 transition-colors"
              >
                View Job Openings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Our Services
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Career Support
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From resume building to job placement, we provide everything you need to launch your career.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((service, index) => (
              <Link
                key={index}
                href={service.href}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute bottom-4 left-4">
                    <span className="inline-flex items-center gap-1 bg-white/90 text-gray-900 text-xs font-semibold px-3 py-1 rounded-full">
                      <Briefcase className="w-3 h-3" />
                      Career Service
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {service.features.map((feature, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Self-Paced Courses CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <span className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1 rounded-full mb-4">
                Self-Paced Learning
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Career Success Video Courses
              </h2>
              <p className="text-blue-100 text-lg mb-6">
                Learn resume writing, interview skills, and job search strategies at your own pace with our professional video courses.
              </p>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Resume Mastery - $197</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Interview Domination - $297</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Job Search Accelerator - $397</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-yellow-400" />
                  <span>Bundle All 3 & Save - $597</span>
                </li>
              </ul>
              <Link
                href="/career-services/courses"
                className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition"
              >
                Browse Courses
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
            <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
              <Image
                src="/images/business/tax-prep-certification.jpg"
                alt="Career Courses"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Jobs</h2>
            <Link href="/career-services/jobs" className="text-blue-600 hover:underline font-medium">
              View All Jobs →
            </Link>
          </div>

          {jobList.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {jobList.map((job: any) => (
                <div key={job.id} className="bg-white rounded-xl border p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-gray-600 flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {job.company}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      {job.job_type || 'Full-time'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location || 'Remote'}
                    </span>
                    {job.salary_range && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary_range}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/career-services/jobs/${job.id}`}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No current job listings</h3>
              <p className="text-gray-600">Contact our career services team for current opportunities from our employer partners.</p>
            </div>
          )}
        </div>
      </section>

      {/* Success Stats */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold mb-2">85%</p>
              <p className="text-blue-200">Placement Goal</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">100%</p>
              <p className="text-blue-200">Free Training</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">6+</p>
              <p className="text-blue-200">Service Areas</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">24/7</p>
              <p className="text-blue-200">Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Career Services FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'Are career services free?', a: 'Yes, all career services are included with your training program at no additional cost. This includes resume help, interview prep, and job placement assistance.' },
              { q: 'When do career services start?', a: 'Career services begin during your training program. We start working on your resume and job search strategy before you complete training so you\'re ready to apply immediately.' },
              { q: 'Do you guarantee job placement?', a: 'We don\'t guarantee placement, but we have an 85% placement rate goal. We work closely with employer partners who actively hire our graduates.' },
              { q: 'What if I need help after I get hired?', a: 'We provide ongoing support even after placement. If you have issues at work or want to advance your career, our team is here to help.' },
              { q: 'Can I use career services if I didn\'t train with you?', a: 'Career services are primarily for our program graduates. However, contact us to discuss your situation - we may be able to help or refer you to resources.' },
              { q: 'How do I access job listings?', a: 'Job listings are available on this page and in your student dashboard. We also send job alerts via email for positions matching your training.' },
            ].map((faq, i) => (
              <details key={i} className="bg-white rounded-xl overflow-hidden shadow-sm group">
                <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-slate-600">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Launch Your Career?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Our career services team is ready to help you take the next step. Schedule a free consultation today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/career-services/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Schedule Consultation
            </Link>
            <Link
              href="/career-services/resources"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Free Resources
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
