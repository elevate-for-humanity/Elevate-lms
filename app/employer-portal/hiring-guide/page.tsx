import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Circle, ArrowRight, FileText, Users, DollarSign, Clock, Award, Download } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hiring Guide | Employer Portal',
  description: 'Step-by-step guide to hiring through Elevate and maximizing tax credits.',
  robots: { index: false, follow: false },
};

const steps = [
  {
    number: 1,
    title: 'Post Your Job',
    description: 'Create a job listing with requirements, pay rate, and benefits. Our team reviews and optimizes for WOTC-eligible candidates.',
    image: '/images/employers/partnership-handshake.jpg',
    tips: ['Include clear job requirements', 'Specify training provided', 'Highlight growth opportunities'],
  },
  {
    number: 2,
    title: 'Review Candidates',
    description: 'Browse pre-screened candidates with verified WOTC eligibility. Each profile shows certifications, skills, and potential tax credits.',
    image: '/images/heroes/success-story-2.jpg',
    tips: ['Check WOTC eligibility status', 'Review completed certifications', 'Look at work history'],
  },
  {
    number: 3,
    title: 'Interview & Select',
    description: 'Schedule interviews through our platform. We provide interview guides and help coordinate schedules.',
    image: '/images/employers/partnership-hiring-event.jpg',
    tips: ['Use structured interviews', 'Assess cultural fit', 'Discuss growth path'],
  },
  {
    number: 4,
    title: 'Complete WOTC Forms',
    description: 'We handle IRS Form 8850 and state forms. Just verify hire date and we submit within the 28-day deadline.',
    image: '/images/homepage/employers.jpg',
    tips: ['Sign forms within 28 days', 'Verify start date accuracy', 'Keep copies for records'],
  },
  {
    number: 5,
    title: 'Onboard & Train',
    description: 'Use our onboarding checklists and training resources. Track progress and certifications in one place.',
    image: '/images/programs-hq/students-learning.jpg',
    tips: ['Complete I-9 and W-4', 'Assign training modules', 'Set 90-day goals'],
  },
  {
    number: 6,
    title: 'Claim Tax Credits',
    description: 'After 120+ hours worked, we process your WOTC certification. Credits appear on your next tax filing.',
    image: '/images/heroes-hq/team-hero.jpg',
    tips: ['Track hours worked', 'Maintain employment records', 'File with annual taxes'],
  },
];

const resources = [
  { title: 'WOTC Eligibility Checklist', type: 'PDF', size: '245 KB' },
  { title: 'Interview Question Guide', type: 'PDF', size: '180 KB' },
  { title: 'Onboarding Checklist Template', type: 'DOCX', size: '95 KB' },
  { title: 'Tax Credit Calculator', type: 'XLSX', size: '120 KB' },
];

export default function HiringGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Hiring Guide" }]} />
<div className="relative h-80 bg-brand-blue-800">
        <Image
          src="/images/heroes/success-story-2.jpg"
          alt="Hiring guide"
          fill
          className="object-cover opacity-20"
        />
        
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {[
            { icon: DollarSign, label: 'Avg. Tax Credit', value: '$4,800', color: 'green' },
            { icon: Clock, label: 'Time to Hire', value: '2-3 weeks', color: 'blue' },
            { icon: Users, label: 'Candidates Available', value: '2,500+', color: 'blue' },
            { icon: Award, label: 'Success Rate', value: '94%', color: 'orange' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm text-center">
              <stat.icon className={`w-8 h-8 text-${stat.color}-600 mx-auto mb-3`} />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">6 Steps to Successful Hiring</h2>

        <div className="space-y-12 mb-16">
          {steps.map((step, index) => (
            <div key={step.number} className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}>
              <div className="md:w-1/2">
                <div className="relative h-64 rounded-2xl overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {step.number}
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 mb-6">{step.description}</p>
                <div className="bg-brand-blue-50 rounded-xl p-4">
                  <p className="font-semibold text-brand-blue-900 mb-3">Pro Tips:</p>
                  <ul className="space-y-2">
                    {step.tips.map((tip, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-700">
                        <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Downloadable Resources</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {resources.map((resource, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-xl hover:border-brand-blue-300 transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{resource.title}</p>
                    <p className="text-sm text-gray-500">{resource.type} - {resource.size}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-blue-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Hiring?</h3>
          <p className="text-brand-blue-200 mb-6 max-w-2xl mx-auto">
            Post your first job and connect with pre-screened, WOTC-eligible candidates today.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/employer-portal/jobs/new"
              className="px-6 py-3 bg-white text-brand-blue-600 rounded-lg hover:bg-gray-100 transition font-semibold flex items-center gap-2"
            >
              Post a Job <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/employer-portal/candidates"
              className="px-6 py-3 border-2 border-white text-white rounded-lg hover:bg-white/10 transition font-semibold"
            >
              Browse Candidates
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
