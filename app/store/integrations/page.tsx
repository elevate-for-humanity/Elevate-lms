import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plug, Circle, Code, Zap, Database, Mail, CreditCard, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Integrations & API | Elevate for Humanity Store',
  description: 'Salesforce, Zapier, REST API, webhooks, and custom integrations. Connect your workforce platform to your existing systems.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/integrations',
  },
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
  
  // Fetch available integrations
  const { data: integrations } = await supabase
    .from('integrations')
    .select('*')
    .eq('status', 'active');
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Integrations" }]} />
      </div>
<section className="bg-slate-100 text-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Plug className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-black mb-6">
            Connect Everything
          </h1>
          <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
            REST API, webhooks, Salesforce integration, and 1000+ apps via Zapier. Built for enterprise workflows.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Integrations</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-brand-blue-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Salesforce</h3>
                  <span className="px-3 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                    Native Integration
                  </span>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Bi-directional sync with Salesforce. Automatically create leads, update opportunities, and track student outcomes in your CRM.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Real-time student enrollment sync</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Automatic lead creation from applications</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Course completion tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Custom field mapping</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Webhook triggers for workflows</span>
                </li>
              </ul>
              <div className="bg-brand-blue-50 rounded-lg p-4">
                <div className="font-bold mb-2">Setup Time</div>
                <div className="text-gray-700">15-30 minutes with guided wizard</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-8 h-8 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Zapier</h3>
                  <span className="px-3 py-2 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-bold">
                    1000+ Apps
                  </span>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Connect to 1000+ apps without code. Automate workflows, sync data, and trigger actions across your entire tech stack.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Google Sheets for reporting</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Slack notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Mailchimp email campaigns</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>HubSpot CRM sync</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>QuickBooks accounting</span>
                </li>
              </ul>
              <div className="bg-brand-blue-50 rounded-lg p-4">
                <div className="font-bold mb-2">Setup Time</div>
                <div className="text-gray-700">5-10 minutes per integration</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Built-In Integrations</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: CreditCard, name: 'Stripe', description: 'Payment processing and subscriptions', color: 'blue' },
              { icon: Mail, name: 'Resend', description: 'Transactional email delivery', color: 'green' },
              { icon: Database, name: 'Supabase', description: 'PostgreSQL database and auth', color: 'emerald' },
              { icon: Code, name: 'Netlify', description: 'Hosting and deployment', color: 'teal' },
              
              { icon: Zap, name: 'Twilio', description: 'SMS notifications (optional)', color: 'red' },
            ].map((integration, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition">
                <integration.icon className={`w-12 h-12 text-${integration.color}-600 mb-4`} />
                <h3 className="font-bold text-lg mb-2">{integration.name}</h3>
                <p className="text-sm text-gray-600">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">REST API</h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
              <Code className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">Full API Access</h3>
              <p className="text-gray-700 mb-6">
                Complete REST API with authentication, rate limiting, and comprehensive documentation. Build custom integrations and automate workflows.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-3">Available Endpoints</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <Circle className="w-4 h-4 text-green-600" />
                      <code className="bg-gray-100 px-2 py-2 rounded">POST /api/students</code>
                    </li>
                    <li className="flex items-center gap-2">
                      <Circle className="w-4 h-4 text-green-600" />
                      <code className="bg-gray-100 px-2 py-2 rounded">GET /api/courses</code>
                    </li>
                    <li className="flex items-center gap-2">
                      <Circle className="w-4 h-4 text-green-600" />
                      <code className="bg-gray-100 px-2 py-2 rounded">POST /api/enrollments</code>
                    </li>
                    <li className="flex items-center gap-2">
                      <Circle className="w-4 h-4 text-green-600" />
                      <code className="bg-gray-100 px-2 py-2 rounded">GET /api/progress</code>
                    </li>
                    <li className="flex items-center gap-2">
                      <Circle className="w-4 h-4 text-green-600" />
                      <code className="bg-gray-100 px-2 py-2 rounded">POST /api/certificates</code>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-3">Features</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Circle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>OAuth 2.0 authentication</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Circle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Rate limiting (1000 req/hour)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Circle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Webhook subscriptions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Circle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>JSON responses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Circle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>OpenAPI 3.0 spec</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white text-slate-900 rounded-xl p-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold">Example API Call</h4>
                <span className="text-xs bg-green-600 px-2 py-2 rounded">POST</span>
              </div>
              <pre className="bg-white rounded-lg p-4 overflow-x-auto text-sm">
                <code>{`curl -X POST https://your-platform.com/api/students \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "program": "barber-apprenticeship"
  }'`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-slate-100 rounded-2xl p-12 text-center">
            <Plug className="w-16 h-16 text-indigo-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Need a Custom Integration?</h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Our team can build custom integrations for your specific needs. Salesforce, ERP systems, HRIS, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-slate-900 px-8 py-4 rounded-lg font-bold hover:bg-indigo-700 transition"
              >
                Request Custom Integration
              </Link>
              <Link
                href="/store/licenses"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 transition border-2 border-indigo-600"
              >
                View API Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
