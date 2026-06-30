import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Rocket, Server, Code, CheckCircle, Clock, Zap, Shield, Database } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Deployment & Setup | ${PLATFORM_DEFAULTS.orgName} Store`,
  description: `Complete deployment guide for the ${PLATFORM_DEFAULTS.orgName} platform. One-click deployment, white-label customization, and technical support.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/deployment',
  },
};

export default async function DeploymentPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
          <p className="text-slate-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch deployment options
  const { data: options } = await supabase
    .from('deployment_options')
    .select('*');
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-purple-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Rocket className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-black mb-6">
            Deploy Your Platform in Minutes
          </h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto">
            One-click deployment to your infrastructure. Full white-label customization. Production-ready in under 30 minutes.
          </p>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Deployment Options</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Northflank Managed (Recommended)</h3>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-brand-green-600" />
                <span className="font-semibold text-brand-green-600">5 minutes</span>
              </div>
              <ul className="space-y-2 mb-6 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>One-click deployment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Automatic SSL certificates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Global CDN included</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Auto-scaling</span>
                </li>
              </ul>
              <div className="bg-blue-50 rounded-lg p-4 text-sm">
                <div className="font-bold mb-1">Cost Estimate</div>
                <div className="text-slate-700">$20-100/month depending on usage</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Server className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AWS / Azure / GCP</h3>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-600">30 minutes</span>
              </div>
              <ul className="space-y-2 mb-6 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Full infrastructure control</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Docker container deployment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>VPC and security groups</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Custom domain setup</span>
                </li>
              </ul>
              <div className="bg-purple-50 rounded-lg p-4 text-sm">
                <div className="font-bold mb-1">Cost Estimate</div>
                <div className="text-slate-700">$50-300/month depending on scale</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-green-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-brand-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Self-Hosted</h3>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="font-semibold text-orange-600">1-2 hours</span>
              </div>
              <ul className="space-y-2 mb-6 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Complete data ownership</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>On-premise deployment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Air-gapped environments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Custom security policies</span>
                </li>
              </ul>
              <div className="bg-brand-green-50 rounded-lg p-4 text-sm">
                <div className="font-bold mb-1">Cost Estimate</div>
                <div className="text-slate-700">Hardware costs + maintenance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What's Included</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 rounded-xl p-8">
              <Code className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-4">Complete Source Code</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Full Next.js 16 application</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>TypeScript codebase</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Tailwind CSS styling</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>API routes and webhooks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Database migrations</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-xl p-8">
              <Database className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-4">Infrastructure Setup</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Supabase database configuration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Stripe payment integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Email service setup (Resend)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>File storage (S3/Cloudflare R2)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Environment configuration</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Deployment Process</h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: 'Purchase License',
                  description: 'Complete checkout and receive instant access to GitHub repository',
                  time: '2 minutes',
                },
                {
                  step: 2,
                  title: 'Clone Repository',
                  description: 'Fork or clone the repository to your GitHub account',
                  time: '1 minute',
                },
                {
                  step: 3,
                  title: 'Configure Environment',
                  description: 'Set up environment variables for database, payments, and email',
                  time: '10 minutes',
                },
                {
                  step: 4,
                  title: 'Deploy with Docker',
                  description: 'Build Dockerfile.northflank-lms and Dockerfile.northflank-admin on your Northflank project (or any container host)',
                  time: '5 minutes',
                },
                {
                  step: 5,
                  title: 'White-Label Customization',
                  description: 'Update branding, colors, and domain name',
                  time: '15 minutes',
                },
                {
                  step: 6,
                  title: 'Go Live',
                  description: 'Platform is live and ready for students',
                  time: 'Done!',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-6 bg-white rounded-xl p-6 shadow-lg">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold">{item.title}</h3>
                      <span className="text-sm font-semibold text-blue-600">{item.time}</span>
                    </div>
                    <p className="text-slate-700">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 text-center">
            <Rocket className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Ready to Deploy?</h2>
            <p className="text-xl text-slate-700 mb-8 max-w-2xl mx-auto">
              Get started with your own workforce training platform today. Full support included.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/store/licenses"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 transition"
              >
                View Licenses
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-slate-50 transition border-2 border-blue-600"
              >
                Schedule Setup Call
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
