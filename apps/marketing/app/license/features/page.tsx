import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Users, BookOpen, Award, BarChart3, Shield, Clock, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Features,
  description: 'Discover the powerful features of our workforce development platform including LMS, assessments, and career services.',
};

const coreFeatures = [
  { icon: BookOpen, title: 'Learning Management System', desc: 'Full-featured LMS with course creation, progress tracking, and assessments' },
  { icon: Users, title: 'Student Management', desc: 'Comprehensive student records, enrollment tracking, and communication tools' },
  { icon: Award, title: 'Credential Management', desc: 'Issue and verify industry-recognized credentials and certifications' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time reporting on student outcomes, completion rates, and program performance' },
  { icon: Shield, title: 'Compliance & Security', desc: 'Role-based access, audit logging, encryption controls, privileged-role MFA enforcement, and evidence-gated compliance claims' },
  { icon: Clock, title: 'Flexible Scheduling', desc: 'Self-paced and instructor-led options to fit any program structure' },
  { icon: Globe, title: 'Remote Access', desc: 'Learn anywhere with mobile-responsive design and offline capabilities' },
  { icon: CheckCircle, title: 'Employer Integration', desc: 'Direct connection to hiring partners for job placement support' },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Platform Overview</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features for Workforce Development</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Everything you need to train, certify, and place workers in high-demand careers.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {coreFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">For Training Providers</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" /> Curriculum Builder
                </h4>
                <p className="text-slate-600 text-sm">Create engaging courses with multimedia content, quizzes, and hands-on assignments.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" /> Progress Tracking
                </h4>
                <p className="text-slate-600 text-sm">Monitor student progress in real-time with detailed analytics and alerts.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" /> Testing Center
                </h4>
                <p className="text-slate-600 text-sm">Integrated certification testing with automated scoring and credentialing.</p>
              </div>
            </div>
          </div>

          <div className="bg-brand-blue-700 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to See the Platform?</h2>
            <p className="text-blue-100 mb-6">Request a demo to see all features in action.</p>
            <Link href="/contact" className="inline-block bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
