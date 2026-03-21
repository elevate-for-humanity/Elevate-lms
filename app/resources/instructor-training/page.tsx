import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BookOpen, CheckCircle, Award, Clock, ArrowRight, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Instructor Training | Elevate for Humanity',
  description: 'Training resources and requirements for Elevate for Humanity instructors. Covers pedagogy, compliance, platform usage, and professional development.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/resources/instructor-training' },
};

const modules = [
  {
    title: 'Platform Orientation',
    hours: 2,
    topics: ['LMS navigation and features', 'Student roster management', 'Attendance and hours tracking', 'Grading and assessment tools'],
  },
  {
    title: 'Teaching Methods for Adult Learners',
    hours: 4,
    topics: ['Andragogy principles', 'Competency-based instruction', 'Differentiated instruction strategies', 'Hands-on demonstration techniques'],
  },
  {
    title: 'Compliance and Reporting',
    hours: 3,
    topics: ['WIOA reporting requirements', 'FERPA student privacy', 'Attendance documentation standards', 'Indiana licensing board requirements'],
  },
  {
    title: 'Student Support and Retention',
    hours: 2,
    topics: ['Identifying at-risk students', 'Barrier assessment and referrals', 'Motivational interviewing basics', 'Connecting students to support services'],
  },
  {
    title: 'Safety and Workplace Standards',
    hours: 3,
    topics: ['OSHA compliance for training environments', 'Shop/lab safety protocols', 'Incident reporting procedures', 'Emergency response plans'],
  },
  {
    title: 'Assessment and Evaluation',
    hours: 2,
    topics: ['Creating competency-based assessments', 'Practical skills evaluation rubrics', 'State board exam preparation strategies', 'Progress tracking and documentation'],
  },
];

const certifications = [
  { name: 'OSHA 30 General Industry', required: true },
  { name: 'CPR/First Aid (current)', required: true },
  { name: 'Active Indiana license in teaching field', required: true },
  { name: 'CPI (Crisis Prevention Intervention)', required: false },
  { name: 'Milady Educator Certification', required: false },
];

export default function InstructorTrainingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Resources', href: '/resources' },
            { label: 'Instructor Training' },
          ]} />
        </div>
      </div>

      <section className="bg-brand-blue-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-brand-orange-400" />
          <h1 className="text-4xl font-bold mb-4">Instructor Training</h1>
          <p className="text-xl text-slate-600">
            Resources and requirements for Elevate for Humanity instructors.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Overview</h2>
          <p className="text-slate-600 mb-4">
            All Elevate for Humanity instructors complete a 16-hour onboarding training before
            leading classes. This training covers platform usage, adult education methods,
            compliance requirements, and safety standards. Ongoing professional development
            is required annually.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-white rounded-lg">
              <Clock className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">16</p>
              <p className="text-sm text-slate-600">Onboarding Hours</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <BookOpen className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">6</p>
              <p className="text-sm text-slate-600">Training Modules</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <Award className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">8</p>
              <p className="text-sm text-slate-600">Annual CE Hours</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Training Modules</h2>
          <div className="space-y-6">
            {modules.map((mod, i) => (
              <div key={mod.title} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    <span className="text-brand-blue-600 mr-2">Module {i + 1}:</span>
                    {mod.title}
                  </h3>
                  <span className="text-sm text-slate-500 whitespace-nowrap ml-4">{mod.hours} hours</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {mod.topics.map((topic) => (
                    <div key={topic} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Required Certifications</h2>
          <div className="space-y-3">
            {certifications.map((cert) => (
              <div key={cert.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-brand-blue-600" />
                  <span className="text-slate-900 font-medium">{cert.name}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  cert.required ? 'bg-brand-red-50 text-brand-red-700' : 'bg-white text-slate-600'
                }`}>
                  {cert.required ? 'Required' : 'Recommended'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Interested in Teaching?</h2>
          <p className="text-slate-600 mb-6">
            We&apos;re looking for licensed professionals to teach in our career training programs.
            If you hold an active Indiana license in barbering, cosmetology, HVAC, electrical,
            CDL, healthcare, or IT, we want to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/inquiry?subject=Instructor+Interest"
              className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-red-700 transition"
            >
              Express Interest <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:3172968560"
              className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-white transition"
            >
              <Phone className="w-4 h-4" /> (317) 296-8560
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
