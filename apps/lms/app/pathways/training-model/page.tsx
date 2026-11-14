import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { GraduationCap, Users, BookOpen, Award, Clock, Building } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Training Model | Elevate for Humanity',
  description: 'Learn about Elevate\'s workforce training methodology and learning approach.',
};

const trainingApproaches = [
  {
    icon: GraduationCap,
    title: 'Industry-Aligned Curriculum',
    description: 'Every program is developed with employer input to ensure skills match real job requirements.',
    features: ['O*NET occupational analysis', 'Employer advisory boards', 'Certification prep integrated'],
  },
  {
    icon: Users,
    title: 'Experienced Instructors',
    description: 'Learn from practitioners with real-world experience in their fields.',
    features: ['Industry veteran instructors', 'Hands-on demonstrations', 'Personalized mentorship'],
  },
  {
    icon: BookOpen,
    title: 'Flexible Learning Paths',
    description: 'Study at your own pace with evening and weekend options.',
    features: ['Online and in-person', 'Self-paced modules', 'Live workshop sessions'],
  },
  {
    icon: Clock,
    title: 'Competency-Based Progress',
    description: 'Advance by demonstrating mastery, not just seat time.',
    features: ['Skills assessments', 'Practical evaluations', 'Portfolio projects'],
  },
];

const employerPartners = [
  'IU Health',
  'Ascension St. Vincent',
  'Community Health Network',
  'Trilogy Health Services',
  'Carrier',
  'Johnson Controls',
  'Cummins',
  'Rolls-Royce',
];

export default function TrainingModelPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Pathways', href: '/pathways' }, { label: 'Training Model' }]} />
      </div>

      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-bold mb-6">
              <GraduationCap className="w-4 h-4" />
              Our Training Approach
            </div>
            <h1 className="text-4xl font-black mb-4">How Elevate Trains Workforce Champions</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              We combine industry expertise, flexible learning, and employer partnerships to prepare you for real careers.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-black mb-8">Our Training Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trainingApproaches.map((approach) => (
              <div key={approach.title} className="bg-slate-50 rounded-xl p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <approach.icon className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">{approach.title}</h3>
                    <p className="text-slate-600 mb-4">{approach.description}</p>
                    <ul className="space-y-2">
                      {approach.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                          <span className="w-1.5 h-1.5 bg-brand-blue-600 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange-100 text-brand-orange-900 rounded-full text-sm font-bold mb-4">
              <Building className="w-4 h-4" />
              Employer Partnerships
            </div>
            <h2 className="text-2xl font-bold text-black mb-4">Training Informed by Employer Needs</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Curriculum planning uses employer and occupational input to keep training aligned with job requirements.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {employerPartners.map((partner) => (
              <div key={partner} className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-brand-blue-700 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-bold mb-6">
              <Award className="w-4 h-4" />
              Industry Credentials
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Earn Recognized Credentials</h2>
            <p className="text-blue-100 max-w-2xl mx-auto mb-8">
              Complete your program with the credential or license requirement connected to your selected pathway.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['State Licenses', 'NHA Certifications', 'EPA 608', 'CompTIA A+', 'AWS Certifications'].map((cert) => (
                <span key={cert} className="px-4 py-2 bg-white text-brand-blue-700 rounded-full font-semibold text-sm">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-blue-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Training?</h2>
          <p className="text-blue-100 mb-8">
            Explore available pathways, program requirements, and the application process.
          </p>
          <Link href="/pathways" className="inline-block bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50">
            Explore Programs
          </Link>
        </div>
      </section>
    </div>
  );
}
