import { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap, Users, Building2, Clock,
  CheckCircle, Brain, Zap, Shield, BarChart3,
  BookOpen, MessageSquare, FileText, TrendingUp, ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Features',
  description: 'Explore Elevate for Humanity platform capabilities for learning, apprenticeship operations, workforce workflows, reporting, and organization administration.',
};

const PLATFORM_FEATURES = [
  {
    category: 'For Students',
    icon: GraduationCap,
    features: [
      { title: 'PARiS Guidance', description: 'Guided AI-assisted intake and support workflows help users navigate available platform and career resources.' },
      { title: 'Self-Paced Learning', description: 'Access assigned coursework with lesson and progress tracking.' },
      { title: 'Certification Preparation', description: 'Course content can support preparation for program-aligned credentialing exams where configured.' },
      { title: 'Career Tools', description: 'Resume, interview, and employment-support workflows can be delivered through the learner experience.' },
    ],
  },
  {
    category: 'For Employers',
    icon: Building2,
    features: [
      { title: 'OJL Tracking', description: 'Record on-the-job learning activity and competency sign-offs for configured apprenticeship programs.' },
      { title: 'RTI Management', description: 'Monitor related technical instruction progress for apprentices.' },
      { title: 'Participant Coordination', description: 'Coordinate employer and participant activity through role-based workflows.' },
      { title: 'Program Documentation', description: 'Maintain program and apprenticeship records used by authorized staff and partners.' },
    ],
  },
  {
    category: 'For Workforce Partners',
    icon: Users,
    features: [
      { title: 'Funding Records', description: 'Record funding and eligibility information used in configured workforce workflows.' },
      { title: 'Operational Reporting', description: 'Review available enrollment, progress, and program data through role-based dashboards.' },
      { title: 'Partner Workflows', description: 'Connect authorized training-provider, employer, and participant workflows.' },
      { title: 'Compliance Records', description: 'Maintain apprenticeship and workforce documentation required by configured programs.' },
    ],
  },
];

const CORE_FEATURES = [
  { icon: Brain, title: 'PARiS AI Assistant', description: 'AI-assisted guidance and workflow support within configured platform experiences.' },
  { icon: Zap, title: 'Digital Enrollment', description: 'Online application and enrollment workflows with required-field and status handling.' },
  { icon: Shield, title: 'Role-Based Access', description: 'Authentication and authorization controls restrict protected platform functions by user and role.' },
  { icon: BarChart3, title: 'Operational Analytics', description: 'Dashboards surface available progress, activity, and workflow data.' },
  { icon: BookOpen, title: 'Learning Management', description: 'Course delivery, lesson access, progress tracking, and administrative course workflows.' },
  { icon: MessageSquare, title: 'CRM Workflows', description: 'Lead and participant records can be managed through configured communication and follow-up workflows.' },
  { icon: FileText, title: 'Digital Records', description: 'Store and manage authorized participant documents, records, and credentials.' },
  { icon: TrendingUp, title: 'Outcome Records', description: 'Record available completion, credential, and employment outcome information when supplied.' },
];

const PLATFORM_FACTS = [
  { value: '3', label: 'Production service surfaces' },
  { value: 'Role-based', label: 'Protected access model' },
  { value: 'Digital', label: 'Application and enrollment workflows' },
  { value: 'Tracked', label: 'Course and apprenticeship progress' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">A Workforce Operations Platform</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Learning, apprenticeship, workforce, organization, and reporting workflows in one platform architecture.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-700 font-bold py-4 px-8 rounded-xl hover:bg-blue-50 transition-colors">
                Try the Demo <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-bold py-4 px-8 rounded-xl hover:bg-white/10 transition-colors">
                Schedule a Walkthrough
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {PLATFORM_FACTS.map((fact) => (
              <div key={fact.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-brand-blue-600 mb-2">{fact.value}</div>
                <div className="text-slate-600">{fact.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Platform Capabilities</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Capabilities are shown as implemented platform functions, not guaranteed participant or business outcomes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_FEATURES.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div key={feature.title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Role-Based Workflows</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Different users receive workflows and data appropriate to their authorized role.</p>
          </div>
          <div className="space-y-16">
            {PLATFORM_FEATURES.map((category) => {
              const IconComponent = category.icon;
              return (
                <div key={category.category} className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-brand-blue-600 rounded-xl flex items-center justify-center"><IconComponent className="w-6 h-6 text-white" /></div>
                      <h3 className="text-2xl font-bold text-slate-900">{category.category}</h3>
                    </div>
                    <div className="space-y-6">
                      {category.features.map((feature) => (
                        <div key={feature.title} className="flex gap-4">
                          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                          <div><h4 className="font-bold text-slate-900 mb-1">{feature.title}</h4><p className="text-slate-600">{feature.description}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-100 rounded-2xl aspect-video flex items-center justify-center">
                    <div className="text-center p-8"><IconComponent className="w-16 h-16 text-brand-blue-300 mx-auto mb-4" /><p className="text-slate-500">{category.category} workspace</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Clock className="w-10 h-10 mx-auto mb-4 text-blue-300" />
          <h2 className="text-3xl font-bold mb-4">Evaluate the platform against your requirements</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">Use the demo and trial paths to verify the workflows, permissions, integrations, and reporting your organization requires before purchase.</p>
          <Link href="/store" className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold py-3 px-6 rounded-lg">View Store <ArrowRight className="w-5 h-5" /></Link>
        </div>
      </section>
    </div>
  );
}
