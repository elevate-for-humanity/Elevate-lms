import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Calendar, Users, BookOpen, BarChart, Settings, Shield, Zap } from 'lucide-react';
import { ROUTES } from '@/lib/pricing';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Platform Features | Elevate LMS',
  description: 'Explore the features of the Elevate LMS platform. Learning management, student tracking, employer portal, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/license/features',
  },
};

export const dynamic = 'force-dynamic';

export default async function FeaturesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get features from database
  const { data: dbFeatures } = await db
    .from('platform_features')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('order', { ascending: true });

  const featureCategories = [
    {
      name: 'Self-Operating Automation',
      icon: Zap,
      features: [
        'Auto-enrollment workflows — applications route to programs automatically',
        'Automated status transitions — no manual updates needed',
        'Progress tracking with automated nudges for inactive learners',
        'Credential generation and verification links — instant, not manual',
        'Compliance reporting with audit trails — always export-ready',
        'Employer dashboards with real-time graduate pipelines',
      ],
    },
    {
      name: 'Learning Management',
      icon: BookOpen,
      features: [
        'Course creation and management',
        'Video hosting and streaming',
        'Quizzes and assessments with auto-grading',
        'Progress tracking with automated alerts',
        'Certificates and badges — auto-generated on completion',
        'SCORM/xAPI support',
      ],
    },
    {
      name: 'Student Management',
      icon: Users,
      features: [
        'Auto-routing enrollment management',
        'Attendance tracking with automated reminders',
        'Document management with auto-verification',
        'Automated communication workflows',
        'Self-service student portal',
        'Mobile access',
      ],
    },
    {
      name: 'Reporting & Analytics',
      icon: BarChart,
      features: [
        'Real-time dashboards — no manual refresh',
        'WIOA compliance reports — auto-generated',
        'Outcome tracking with automated alerts',
        'Custom report builder with scheduled delivery',
        'Data export — always audit-ready',
        'API access for integrations',
      ],
    },
    {
      name: 'Administration',
      icon: Settings,
      features: [
        'Multi-tenant architecture',
        'Role-based access control',
        'White-label branding',
        'Automated workflow builder',
        'Integration options',
        'Audit logging — automatic, always on',
      ],
    },
  ];

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'License', href: '/license' }, { label: 'Features' }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Platform Features</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Self-operating workforce infrastructure that runs the entire learner lifecycle — from application to credential — without staff intervention.
          </p>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {featureCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Icon className="w-8 h-8 text-brand-orange-600" />
                    <h2 className="text-2xl font-bold">{category.name}</h2>
                  </div>
                  <ul className="space-y-3">
                    {category.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Automated Self-Service Operations */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">Automated, Self-Service Operations</h2>
          <p className="text-lg text-slate-300 text-center mb-8 max-w-3xl mx-auto">
            This platform operates as a self-service workforce system. Enrollment triggers automated workflows for eligibility, course assignment, progress tracking, compliance logging, credential issuance, and reporting. Staff intervention is required only for exceptions—not daily operations.
          </p>
          <div className="max-w-2xl mx-auto">
            <ul className="space-y-4">
              <li className="flex items-start gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-slate-200 text-lg">Automated enrollment orchestration</span>
              </li>
              <li className="flex items-start gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-slate-200 text-lg">Rules-based progress and hour tracking</span>
              </li>
              <li className="flex items-start gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-slate-200 text-lg">Automated nudges and interventions</span>
              </li>
              <li className="flex items-start gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-slate-200 text-lg">Auto-generated compliance and outcome reports</span>
              </li>
              <li className="flex items-start gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-slate-200 text-lg">Credential issuance with public verification</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Our Programs Work</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <Zap className="w-12 h-12 text-brand-orange-600 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Fast Implementation</h3>
              <p className="text-gray-600">Get up and running in weeks, not months</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <Shield className="w-12 h-12 text-brand-orange-600 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Compliance Ready</h3>
              <p className="text-gray-600">Built-in WIOA, FERPA, and DOL compliance</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <Users className="w-12 h-12 text-brand-orange-600 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Dedicated Support</h3>
              <p className="text-gray-600">Training and support included with every license</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Integrations</h2>
          <p className="text-gray-600 mb-8">
            Connect with the tools you already use
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Salesforce', 'Workday', 'ADP', 'Zoom', 'Google Workspace', 'Microsoft 365'].map((integration) => (
              <span key={integration} className="bg-white px-4 py-2 rounded-lg text-gray-700">
                {integration}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-orange-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            See It In Action
          </h2>
          <p className="text-brand-orange-100 mb-8">
            Schedule a personalized demo to explore all features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={ROUTES.schedule}
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-orange-600 px-8 py-4 rounded-lg font-bold hover:bg-brand-orange-50 transition"
            >
              <Calendar className="w-5 h-5" />
              Schedule Demo
            </Link>
            <Link
              href="/license/pricing"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-orange-700 transition"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
