import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Building2, Users, BarChart3, FileText, ArrowRight, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Client Portal | Elevate For Humanity',
  description: 'Access your organization\'s training dashboard, track employee progress, and manage your workforce development programs.',
};

const features = [
  {
    icon: Users,
    title: 'Employee Management',
    description: 'Track enrollment, progress, and completion for all your sponsored employees.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights into training outcomes, ROI, and workforce development metrics.',
  },
  {
    icon: FileText,
    title: 'Reporting',
    description: 'Generate compliance reports, completion certificates, and funding documentation.',
  },
  {
    icon: Shield,
    title: 'Secure Access',
    description: 'Enterprise-grade security with role-based permissions and SSO support.',
  },
];

const benefits = [
  'Track employee training progress in real-time',
  'Access completion certificates and transcripts',
  'Generate reports for compliance and funding',
  'Manage multiple locations from one dashboard',
  'Direct communication with training coordinators',
  'Custom training program development',
];

export default function ClientPortalPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Client Portal" }]} />
      </div>
{/* Hero */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 bg-slate-700 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              For Organizations
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Client Portal
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Manage your organization's workforce development programs. Track employee progress, access reports, and maximize your training investment.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Request Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Portal Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <feature.icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Everything You Need to Manage Training</h2>
              <p className="text-gray-600 mb-8">
                Our client portal gives you complete visibility into your workforce development programs with powerful tools to track, report, and optimize.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border rounded-xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Request Portal Access</h3>
              <p className="text-gray-600 mb-6">
                Contact us to set up your organization's client portal account.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors w-full justify-center"
              >
                Contact Us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Already Have an Account?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Sign in to access your organization's training dashboard and reports.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors"
          >
            Sign In to Portal
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
