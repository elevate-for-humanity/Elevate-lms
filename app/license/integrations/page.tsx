import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Zap, Database, Mail, Award, Calendar, ArrowRight, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { INTEGRATIONS, DISCLAIMERS, ROUTES } from '@/lib/pricing';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Integrations | Elevate LMS Licensing',
  description: 'Salesforce CRM integration, Supabase authentication, email providers, and credentialing partners. Connect the Elevate LMS with your systems.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/license/integrations',
  },
};

const iconMap: Record<string, typeof Zap> = {
  salesforce: Zap,
  supabase: Database,
  email: Mail,
  credentialing: Award,
};

const statusColors: Record<string, { bg: string; text: string }> = {
  'Integration-ready': { bg: 'bg-brand-blue-100', text: 'text-brand-blue-700' },
  'Included': { bg: 'bg-green-100', text: 'text-green-700' },
  'Configurable': { bg: 'bg-brand-blue-100', text: 'text-brand-blue-700' },
};

export default async function IntegrationsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch integrations
  const { data: dbIntegrations } = await supabase
    .from('integrations')
    .select('*')
    .eq('status', 'active');

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'License', href: '/license' }, { label: 'Integrations' }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Integrations</h1>
            <p className="text-xl text-slate-600">
              Connect the Elevate LMS with your existing systems and workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Integrations List */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {INTEGRATIONS.map((integration) => {
              const Icon = iconMap[integration.id] || Zap;
              const colors = statusColors[integration.status] || statusColors['Configurable'];
              
              return (
                <div key={integration.id} className="bg-white border border-slate-200 rounded-xl p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-8 h-8 text-slate-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h2 className="text-2xl font-bold text-slate-900">{integration.name}</h2>
                        <span className={`px-3 py-2 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                          {integration.status}
                        </span>
                      </div>
                      
                      <p className="text-lg text-slate-600 mb-4">{integration.description}</p>
                      
                      <div className="flex items-start gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{integration.note}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Salesforce Deep Dive */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Salesforce Integration</h2>
            <p className="text-lg text-slate-600">How the Elevate LMS connects with Salesforce CRM</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 mb-4">Data Flow</h3>
                
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-brand-blue-100 text-brand-blue-700 px-4 py-2 rounded-lg text-center text-sm font-medium">
                    Elevate LMS
                  </div>
                  <ArrowRightLeft className="w-6 h-6 text-slate-400" />
                  <div className="w-32 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-center text-sm font-medium">
                    Salesforce
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  {[
                    'New leads sync to Salesforce',
                    'Program interest captured',
                    'Enrollment status updates',
                    'Employer partner records',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <ArrowRight className="w-4 h-4 text-green-600" />
                      <span className="text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Implementation</h3>
                <p className="text-slate-600 text-sm mb-4">
                  {DISCLAIMERS.integration}
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Works with Salesforce Sales Cloud and Service Cloud</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Custom object mapping available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Implementation support included with Enterprise licenses</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Questions about integrations?</h2>
          <p className="text-slate-300 mb-8">
            We'll discuss your integration needs during the demo and provide implementation guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={ROUTES.schedule}
              className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              <Calendar className="w-5 h-5" />
              Schedule a Demo
            </Link>
            <Link
              href={ROUTES.licensePricing}
              className="inline-flex items-center justify-center gap-2 bg-transparent text-white px-8 py-4 rounded-lg font-semibold border-2 border-white hover:bg-white/10 transition"
            >
              View Pricing <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
