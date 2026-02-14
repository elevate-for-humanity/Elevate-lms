'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  BarChart3, 
  ArrowRight, 
  CheckCircle,
  TrendingUp,
  Users,
  Target,
  PieChart,
  LineChart,
  Activity,
  Download,
  Bell,
  Zap
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const features = [
  {
    icon: LineChart,
    title: 'Real-Time Dashboards',
    description: 'Monitor student progress, enrollment trends, and program performance with live updating dashboards.',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    description: 'AI-powered predictions for student outcomes, dropout risk, and completion rates.',
  },
  {
    icon: PieChart,
    title: 'Custom Reports',
    description: 'Build custom reports with drag-and-drop interface. Export to PDF, Excel, or integrate with BI tools.',
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Set and track organizational KPIs with automated progress monitoring and alerts.',
  },
  {
    icon: Users,
    title: 'Cohort Analysis',
    description: 'Compare performance across cohorts, programs, funding sources, and demographics.',
  },
  {
    icon: Bell,
    title: 'Automated Alerts',
    description: 'Get notified when metrics fall below thresholds or when action is needed.',
  },
];



const useCases = [
  {
    title: 'Workforce Boards',
    description: 'Track WIOA performance metrics, generate compliance reports, and monitor provider outcomes.',
    image: '/images/store/platform-hero.jpg',
  },
  {
    title: 'Training Providers',
    description: 'Monitor student progress, identify at-risk learners, and optimize program delivery.',
    image: '/images/store/community-hub.jpg',
  },
  {
    title: 'Employers',
    description: 'Track apprentice performance, measure ROI on training investments, and forecast hiring needs.',
    image: '/images/store/crm-hub.jpg',
  },
];

export default function AnalyticsProPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Store', href: '/store' }, 
            { label: 'Add-Ons', href: '/store/add-ons' },
            { label: 'Analytics Pro' }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden">
        <Image
          src="/images/store/platform-hero.jpg"
          alt="Analytics Pro"
          fill
          className="object-cover"
          priority
        />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-indigo-200 font-medium">Platform Add-On</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-4">
            Analytics Pro
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl mb-6">
            Advanced reporting and predictive analytics for workforce development. 
            Turn data into actionable insights that improve student outcomes.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/contact?product=analytics-pro"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Request Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="#features"
              className="inline-flex items-center gap-2 border-2 border-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              View Features
            </Link>
          </div>
        </div>
      </section>



      {/* Features Grid */}
      <section id="features" className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Powerful Analytics Features</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to understand, predict, and improve workforce outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for Workforce Development</h2>
            <p className="text-lg text-slate-600">Analytics designed for the unique needs of workforce organizations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="relative h-48">
                  <Image
                    src={useCase.image}
                    alt={useCase.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{useCase.title}</h3>
                  <p className="text-slate-600">{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-slate-100 rounded-2xl p-8 md:p-12 text-slate-900 text-center">
            <h2 className="text-3xl font-bold mb-4">Enterprise Pricing</h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Analytics Pro is available as an add-on to Enterprise licenses. 
              Pricing is based on organization size and data volume.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact?product=analytics-pro"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Request Pricing
              </Link>
              <Link
                href="/store/add-ons"
                className="inline-flex items-center gap-2 border-2 border-white text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                View All Add-Ons
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Improve Your Data?</h2>
          <p className="text-xl text-slate-700 mb-8">
            Schedule a demo to see Analytics Pro in action with your own data.
          </p>
          <Link
            href="/contact?product=analytics-pro&demo=true"
            className="inline-flex items-center gap-2 bg-indigo-600 text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Schedule Demo
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
