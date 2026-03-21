
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileText,

  Target,
  ArrowRight,
  Download,
  Eye,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Resume Building - Create a Winning Resume | Elevate for Humanity',
  description:
    'Professional resume writing services and templates. Get expert help crafting a resume that gets you noticed by employers.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/career-services/resume-building',
  },
};

export default function ResumeBuildingPage() {

  const resumeSections = [
    {
      title: 'Contact Information',
      description: 'Name, phone, email, LinkedIn, and location',
      tips: ['Use a professional email address', 'Include LinkedIn if updated', 'City and state only (no full address)'],
    },
    {
      title: 'Professional Summary',
      description: '2-3 sentences highlighting your value proposition',
      tips: ['Tailor to each job application', 'Include years of experience', 'Mention key skills and achievements'],
    },
    {
      title: 'Work Experience',
      description: 'Relevant positions with accomplishments',
      tips: ['Use action verbs', 'Quantify achievements when possible', 'Focus on results, not just duties'],
    },
    {
      title: 'Education & Certifications',
      description: 'Degrees, certifications, and relevant training',
      tips: ['List most recent first', 'Include graduation dates', 'Add relevant coursework if recent graduate'],
    },
    {
      title: 'Skills',
      description: 'Technical and soft skills relevant to the role',
      tips: ['Match skills to job description', 'Include proficiency levels', 'Separate technical from soft skills'],
    },
  ];

  const actionVerbs = [
    'Achieved', 'Built', 'Created', 'Delivered', 'Enhanced',
    'Facilitated', 'Generated', 'Implemented', 'Led', 'Managed',
    'Negotiated', 'Optimized', 'Produced', 'Reduced', 'Streamlined',
  ];

  return (
    <div className="bg-white">      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services', href: '/career-services' }, { label: 'Resume Building' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/resume-building-hero.jpg"
          alt="Resume Building Services"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        

      </section>

      {/* Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Our Resume Services
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition">
              <FileText className="w-12 h-12 text-brand-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Resume Review</h3>
              <p className="text-gray-600 mb-4">
                Get expert feedback on your existing resume with specific suggestions for improvement.
              </p>
              <p className="text-brand-green-600 font-bold">Free for participants</p>
            </div>

            <div className="bg-brand-green-50 rounded-xl p-8 text-center border-2 border-brand-green-200 hover:shadow-lg transition">
              <Sparkles className="w-12 h-12 text-brand-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Resume Writing</h3>
              <p className="text-gray-600 mb-4">
                Work one-on-one with a career coach to create a professional resume from scratch.
              </p>
              <p className="text-brand-green-600 font-bold">Most Popular</p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition">
              <Target className="w-12 h-12 text-brand-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">ATS Optimization</h3>
              <p className="text-gray-600 mb-4">
                Ensure your resume passes Applicant Tracking Systems and reaches human reviewers.
              </p>
              <p className="text-brand-green-600 font-bold">Included with all services</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resume Sections */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Essential Resume Sections
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            A well-structured resume makes it easy for employers to find the information they need.
          </p>

          <div className="space-y-6">
            {resumeSections.map((section, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="md:w-1/3">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{section.title}</h3>
                    <p className="text-gray-600">{section.description}</p>
                  </div>
                  <div className="md:w-2/3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Tips:</p>
                    <p className="text-gray-600 leading-relaxed">{section.tips.join('. ')}.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Action Verbs */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Power Words for Your Resume
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Start your bullet points with strong action verbs to make your accomplishments stand out.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {actionVerbs.map((verb, index) => (
              <span
                key={index}
                className="bg-brand-green-100 text-brand-green-800 px-4 py-2 rounded-full font-medium"
              >
                {verb}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Common Resume Mistakes to Avoid
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border-l-4 border-brand-red-500">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-brand-red-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Typos and Grammar Errors</h3>
                  <p className="text-gray-600 text-sm">Always proofread multiple times and have someone else review it.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border-l-4 border-brand-red-500">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-brand-red-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Generic Objectives</h3>
                  <p className="text-gray-600 text-sm">Replace with a tailored professional summary that shows your value.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border-l-4 border-brand-red-500">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-brand-red-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Listing Duties Instead of Achievements</h3>
                  <p className="text-gray-600 text-sm">Focus on what you accomplished, not just what you were responsible for.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border-l-4 border-brand-red-500">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-brand-red-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Too Long or Too Short</h3>
                  <p className="text-gray-600 text-sm">Keep it to 1-2 pages. Be concise but include all relevant information.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border-l-4 border-brand-red-500">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-brand-red-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Unprofessional Email Address</h3>
                  <p className="text-gray-600 text-sm">Use a simple email format like firstname.lastname@email.com.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border-l-4 border-brand-red-500">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-brand-red-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Not Tailoring to the Job</h3>
                  <p className="text-gray-600 text-sm">Customize your resume for each application using keywords from the job posting.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ATS Tips */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-brand-blue-50 rounded-xl p-8 border-2 border-brand-blue-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Beat the ATS (Applicant Tracking System)
            </h2>
            <p className="text-gray-700 mb-6 text-center">
              Most companies use software to screen resumes before a human sees them. Here is how to get through:
            </p>

            <p className="text-gray-700 leading-relaxed">
              Use standard section headings (Experience, Education, Skills) and include keywords from the job posting. 
              Keep the format simple and clean — avoid tables, graphics, and headers/footers that ATS software cannot read. 
              Save your resume as .docx or .pdf depending on what the job posting requests. Spell out acronyms at least once so the system can match them.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Build Your Resume?
          </h2>
          <p className="text-xl mb-8 text-brand-green-100">
            Work with our career coaches to create a resume that gets results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="bg-white hover:bg-white text-brand-green-700 px-8 py-4 rounded-lg text-lg font-bold transition-all inline-flex items-center justify-center"
            >
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/career-services"
              className="bg-brand-green-600 hover:bg-brand-green-500 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all border-2 border-white"
            >
              View All Career Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
