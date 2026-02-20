export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Clock, Shield, AlertTriangle, CreditCard } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Service Level Agreement | Elevate for Humanity',
  description: 'Platform availability targets, service commitments, and service credit policy.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/sla',
  },
};

export default async function SLAPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('policies').select('*').limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'SLA' }]} />
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12 mt-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-brand-orange-600" />
              <h1 className="text-4xl font-bold text-black">Service Level Agreement</h1>
        </div>
        <p className="text-sm text-gray-600">Last Updated: January 24, 2026</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
        <p className="text-black mb-6">
          This Service Level Agreement (SLA) defines the availability targets, service 
          commitments, and remedies for the Elevate for Humanity platform. It applies to 
          all paying customers and institutional partners.
        </p>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Platform Availability</h2>
        <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-brand-blue-600" />
            <h3 className="text-2xl font-bold text-brand-blue-800 m-0">99.5% Monthly Uptime Target</h3>
          </div>
          <p className="text-black m-0">
            We target 99.5% availability for the Elevate platform during each calendar month, 
            measured as the percentage of time the platform is operational and accessible.
          </p>
        </div>

        <h3 className="text-xl font-bold text-black mt-6 mb-3">What Counts as Downtime</h3>
        <ul className="list-disc pl-6 mb-6 text-black space-y-2">
          <li>Platform is completely inaccessible to users</li>
          <li>Core functionality (login, course access, enrollment) is unavailable</li>
          <li>Database is unreachable causing application errors</li>
        </ul>

        <h3 className="text-xl font-bold text-black mt-6 mb-3">What Does Not Count as Downtime</h3>
        <ul className="list-disc pl-6 mb-6 text-black space-y-2">
          <li>Scheduled maintenance (announced 48+ hours in advance)</li>
          <li>Issues caused by user's internet connection or device</li>
          <li>Third-party service outages (payment processors, email providers)</li>
          <li>Force majeure events (natural disasters, government actions, etc.)</li>
          <li>Features in beta or preview status</li>
        </ul>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Service Credits</h2>
        <div className="bg-brand-green-50 rounded-lg p-6 border-2 border-brand-green-200 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-6 h-6 text-brand-green-600" />
            <h3 className="text-xl font-bold text-brand-green-800 m-0">Financially Backed SLA</h3>
          </div>
          <p className="text-black mb-4">
            If monthly platform availability falls below the uptime targets stated above, 
            customers may be eligible for a service credit applied to a future billing cycle.
          </p>
          
          <h4 className="font-bold text-black mb-3">Credit Schedule</h4>
          <div className="bg-white rounded-lg overflow-hidden border border-brand-green-200 mb-4">
            <table className="w-full text-left">
              <thead className="bg-brand-green-100">
                <tr>
                  <th className="px-4 py-3 font-semibold text-black">Monthly Availability</th>
                  <th className="px-4 py-3 font-semibold text-black">Service Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-green-100">
                <tr>
                  <td className="px-4 py-3 text-black">Below 99.5%</td>
                  <td className="px-4 py-3 text-black font-semibold">5% credit</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-black">Below 99.0%</td>
                  <td className="px-4 py-3 text-black font-semibold">10% credit (maximum)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <h3 className="text-xl font-bold text-black mt-6 mb-3">Service Credit Terms</h3>
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <ul className="space-y-3 text-black m-0 list-none p-0">
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Credits apply <strong>only to future invoices</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Credits are <strong>non-cumulative</strong> and capped at 10% per billing cycle</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Credits must be <strong>requested within 30 days</strong> of the affected period</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Credits do <strong>not apply to one-time fees</strong> or third-party services</span>
            </li>
          </ul>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-black m-0">
              <strong>Important:</strong> This SLA does not provide refunds or cash compensation 
              and excludes events outside reasonable control (force majeure).
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Support Response Times</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-black">Priority</th>
                <th className="px-4 py-3 font-semibold text-black">Description</th>
                <th className="px-4 py-3 font-semibold text-black">Response Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-black font-semibold text-brand-red-600">Critical</td>
                <td className="px-4 py-3 text-black">Platform down, data breach, security incident</td>
                <td className="px-4 py-3 text-black">4 hours</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-black font-semibold text-brand-orange-600">High</td>
                <td className="px-4 py-3 text-black">Major feature unavailable, payment issues</td>
                <td className="px-4 py-3 text-black">8 hours</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-black font-semibold text-yellow-600">Medium</td>
                <td className="px-4 py-3 text-black">Feature degradation, non-blocking bugs</td>
                <td className="px-4 py-3 text-black">24 hours</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-black font-semibold text-brand-green-600">Low</td>
                <td className="px-4 py-3 text-black">General questions, feature requests</td>
                <td className="px-4 py-3 text-black">48 hours</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-black mb-6">
          Response times are measured during business hours: Monday–Friday, 8:00 AM – 6:00 PM EST.
        </p>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Scheduled Maintenance</h2>
        <p className="text-black mb-4">
          We perform regular maintenance to ensure platform security and performance:
        </p>
        <ul className="list-disc pl-6 mb-6 text-black space-y-2">
          <li><strong>Maintenance Window:</strong> Sundays, 2:00 AM – 6:00 AM EST</li>
          <li><strong>Advance Notice:</strong> 48 hours minimum for planned maintenance</li>
          <li><strong>Emergency Maintenance:</strong> May occur without notice for critical security updates</li>
        </ul>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">How to Request a Service Credit</h2>
        <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
          <li>Email <strong>Contact Us</strong> within 30 days of the incident</li>
          <li>Include your organization name and account details</li>
          <li>Describe the downtime period (dates and times)</li>
          <li>We will verify the incident and apply credits within 30 days if eligible</li>
        </ol>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact</h2>
        <ul className="list-none mb-6 text-black space-y-2 p-0">
          <li><strong>General Support:</strong> our contact form</li>
          <li><strong>Billing Questions:</strong> our contact form</li>
          <li><strong>Phone:</strong> (317) 314-3757</li>
        </ul>

        <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
          <p className="text-black mb-2">
            <strong>Related Policies:</strong>
          </p>
          <ul className="list-disc pl-6 text-black space-y-1 m-0">
            <li>
              <Link href="/policies/response-sla" className="text-brand-blue-600 hover:underline">
                Response Time SLA
              </Link>
            </li>
            <li>
              <Link href="/policies/disaster-recovery" className="text-brand-blue-600 hover:underline">
                Disaster Recovery Policy
              </Link>
            </li>
            <li>
              <Link href="/policies/incident-response" className="text-brand-blue-600 hover:underline">
                Incident Response Policy
              </Link>
            </li>
            <li>
              <Link href="/policies/terms" className="text-brand-blue-600 hover:underline">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>
        </article>
      </div>
    </div>
  );
}
