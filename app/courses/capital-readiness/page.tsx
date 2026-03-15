
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  
  BookOpen, 
  Award, 
  Clock, 
  Users, 
  FileText,
  ArrowRight,
  Play,
  Target
} from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Capital Readiness Course for Workforce & Licensed Organizations | Elevate',
  description: 'Learn to build institutional trust, pass audits, and access funding. A structured course for licensed businesses and workforce-aligned organizations.',
  keywords: ['capital readiness course', 'workforce funding training', 'audit readiness', 'institutional trust', 'compliance training'],
  openGraph: {
    title: 'Capital Readiness Course for Workforce & Licensed Organizations',
    description: 'Learn to build institutional trust, pass audits, and access funding.',
    url: `${siteUrl}/courses/capital-readiness`,
    siteName: 'Elevate for Humanity',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/images/og/capital-readiness-course.jpg`,
        width: 1200,
        height: 630,
        alt: 'Capital Readiness Course',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Capital Readiness Course | Elevate for Humanity',
    description: 'Learn to build institutional trust, pass audits, and access funding.',
  },
  alternates: {
    canonical: `${siteUrl}/courses/capital-readiness`,
  },
};

// JSON-LD Course Schema
const courseSchema = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Capital Readiness for Licensed & Workforce-Aligned Organizations',
  description: 'A structured course on capital readiness, compliance, and institutional trust for licensed businesses, workforce-aligned employers, and nonprofits.',
  provider: {
    '@type': 'Organization',
    name: 'Elevate for Humanity',
    url: siteUrl,
  },
  educationalLevel: 'Professional',
  courseCode: 'CR-101',
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: 'PT4H',
  },
};

export default function CapitalReadinessCoursePage() {

  const outcomes = [
    'Understand how institutions evaluate organizations for funding',
    'Build systems that survive audits and earn trust',
    'Separate personal and business finances properly',
    'Navigate WIOA compliance and workforce reporting',
    'Create documentation that demonstrates readiness',
    'Progress through capital readiness levels systematically',
  ];

  const modules = [
    { title: 'Foundation: Trust Before Capital', duration: '25 min', lessons: 3 },
    { title: 'Entity Separation & Structure', duration: '30 min', lessons: 4 },
    { title: 'Credit as a Reputation System', duration: '20 min', lessons: 3 },
    { title: 'Banking Behavior & Signals', duration: '25 min', lessons: 3 },
    { title: 'Tax Compliance & Documentation', duration: '30 min', lessons: 4 },
    { title: 'Public Funding Requirements', duration: '35 min', lessons: 5 },
    { title: 'Growth Without Cracks', duration: '20 min', lessons: 3 },
    { title: 'The Elevate Model in Practice', duration: '25 min', lessons: 4 },
    { title: 'Capital Readiness Assessment', duration: '30 min', lessons: 3 },
    { title: 'Action Planning & Next Steps', duration: '20 min', lessons: 2 },
  ];

  const audiences = [
    { title: 'Licensed Businesses', description: 'Build institutional credibility and access growth capital' },
    { title: 'Workforce-Funded Orgs', description: 'Navigate WIOA, reporting, and audit requirements' },
    { title: 'Nonprofits', description: 'Prepare for grants and institutional funding' },
    { title: 'Program Administrators', description: 'Train partners on compliance and readiness' },
  ];

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-white text-white py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-1 bg-emerald-600/20 text-emerald-400 text-sm font-medium rounded-full mb-6">
                  Online Course
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Capital Readiness for Licensed & Workforce-Aligned Organizations
                </h1>
                <p className="text-xl text-emerald-100 mb-8">
                  A structured course on building institutional trust, passing audits, 
                  and accessing funding—without shortcuts.
                </p>
                
                <div className="flex flex-wrap gap-6 mb-8 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <span>4+ hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <span>10 modules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span>Certificate</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/store/guides/capital-readiness"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition"
                  >
                    Get the Guide + Course
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#modules"
                    className="inline-flex items-center gap-2 px-8 py-4 border border-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-800/50 transition"
                  >
                    View Curriculum
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                  <div className="aspect-video bg-white rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                      <p className="text-slate-900 font-medium">Course Preview</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">What You'll Learn</h2>
            <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
              Practical skills and frameworks for building fundable, audit-ready organizations
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outcomes.map((outcome, index) => (
                <div key={index} className="flex items-start gap-4 bg-white rounded-xl p-6 shadow-sm">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-slate-700">{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modules */}
        <section id="modules" className="py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">Course Curriculum</h2>
            <p className="text-center text-slate-600 mb-12">10 modules covering the complete capital readiness framework</p>
            
            <div className="space-y-4">
              {modules.map((module, index) => (
                <div key={index} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-900">{module.title}</h3>
                        <p className="text-sm text-slate-500">{module.lessons} lessons</p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {module.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-16 lg:py-24 bg-white text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">Who This Course Is For</h2>
            <p className="text-center text-slate-500 mb-12">Designed for organizations seeking institutional credibility and funding access</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {audiences.map((audience, index) => (
                <div key={index} className="bg-white rounded-xl p-6">
                  <Target className="w-8 h-8 text-emerald-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{audience.title}</h3>
                  <p className="text-slate-500 text-sm">{audience.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certificate */}
        <section className="py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-emerald-50 rounded-2xl p-8 lg:p-12 text-center">
              <Award className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Certificate of Completion</h2>
              <p className="text-slate-600 mb-6 max-w-xl mx-auto">
                Upon completing all modules and assessments, you'll receive a certificate 
                demonstrating your understanding of capital readiness principles.
              </p>
              <p className="text-sm text-slate-500">
                Note: This is an educational certificate, not a professional credential or license.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Build Institutional Trust?</h2>
            <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
              Get the Capital Readiness Guide with integrated course access. 
              Start building systems that earn trust and unlock funding.
            </p>
            <Link
              href="/store/guides/capital-readiness"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition"
            >
              Get Started — $39
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Related Content */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8">Related Resources</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/store/guides/capital-readiness" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <FileText className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="font-semibold mb-2">Capital Readiness Guide</h3>
                <p className="text-slate-600 text-sm">The complete ebook with integrated workbook and readiness scoring.</p>
              </Link>
              <Link href="/programs" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <Users className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="font-semibold mb-2">Workforce Programs</h3>
                <p className="text-slate-600 text-sm">Explore our workforce development and training programs.</p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
