
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Info, Check, X, Building2, Shield, ArrowRight } from 'lucide-react';
import { LicenseDemo } from '@/components/store/LicenseDemo';

export const metadata: Metadata = {
  title: 'Enterprise Source-Use License | Elevate for Humanity',
  description: 'Enterprise internal deployment license. Source code access for internal use.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/licensing/enterprise',
  },
};

export default function SourceUseLicensePage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Source Use" }]} />
      </div>
{/* Hero */}
      <section className="relative py-20 overflow-hidden bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-brand-blue-50 border border-brand-blue-200 rounded-full px-4 py-2 mb-6">
              <Building2 className="w-4 h-4 text-brand-blue-600" />
              <span className="text-brand-blue-600 text-sm font-medium">Enterprise License</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              Enterprise Source-Use License
            </h1>
            
            <p className="text-xl text-slate-600 mb-4 max-w-2xl mx-auto">
              This license grants limited internal use of source code only. 
              Ownership, rebranding, resale, sublicensing, and credential use are expressly prohibited.
            </p>
            <p className="text-slate-600 max-w-2xl mx-auto mb-10">
              This is NOT our standard offering. Most organizations should use the Managed Platform instead.
            </p>

            {/* Platform screenshot */}
            <div className="max-w-3xl mx-auto">
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-slate-200">
                <Image
                  src="/images/demos/lms-overview-thumb.jpg"
                  alt="Elevate platform overview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 70vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <section className="py-8 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-brand-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-slate-900 font-bold mb-2">Enterprise Pricing</h3>
              <p className="text-slate-600 text-sm mb-3">
                The Enterprise Source-Use License starts at <strong className="text-slate-900">$75,000</strong>.
                It is designed for organizations that need to deploy on their own infrastructure.
              </p>
              <p className="text-slate-600 text-sm">
                Looking for a faster start?{' '}
                <Link href="/store/licensing/managed" className="text-brand-blue-600 font-semibold underline hover:text-brand-blue-700">Managed Platform License</Link>{' '}
                includes hosting, support, and updates at a lower cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What This Is / Is Not */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* What You Get */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Check className="w-6 h-6 text-brand-green-500" />
                What You Get
              </h2>
              <ul className="space-y-4">
                {[
                  'Access to source code repository',
                  'Right to deploy on your own infrastructure',
                  'Core LMS and course management features',
                  'Student enrollment and tracking',
                  'Basic reporting and analytics',
                  'Internal organizational use',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-700">
                    <Check className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* License Scope */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-500" />
                License Scope
              </h2>
              <p className="text-slate-600 mb-6">
                This license grants source code access for internal deployment. The following are available through our Managed Platform license instead:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { item: 'White-label branding', alt: 'Managed Platform' },
                  { item: 'Managed hosting', alt: 'Managed Platform' },
                  { item: 'Compliance reporting', alt: 'Managed Platform' },
                  { item: 'Ongoing support & updates', alt: 'Managed Platform' },
                ].map(({ item, alt }) => (
                  <div key={item} className="flex items-start gap-3 text-slate-600 text-sm">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>{item} — <Link href="/store/licensing/managed" className="text-brand-blue-600 hover:underline">{alt}</Link></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <LicenseDemo
        tourId="workforce_program"
        licenseName="Enterprise Source-Use License"
        workflows={[
          'Deploy the platform on your own infrastructure',
          'Configure WIOA eligibility and funding rules',
          'Set up outcome tracking and federal reporting',
          'Integrate with existing workforce systems',
          'Manage multi-location partner networks',
        ]}
        ctaHref="/contact?topic=enterprise-review"
        ctaLabel="Request Enterprise Review"
      />

      {/* Restrictions */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">License Restrictions</h2>
          
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-500 font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-slate-900 font-semibold mb-1">Internal Use Only</h3>
                  <p className="text-slate-600 text-sm">
                    You may only use this software within your own organization for your own workforce development operations. 
                    You may NOT offer it as a service to third parties.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-500 font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-slate-900 font-semibold mb-1">Attribution Required</h3>
                  <p className="text-slate-600 text-sm">
                    All deployments must display "Powered by Elevate for Humanity™" in the footer, about page, and login screen. 
                    Removal of attribution is a material breach and terminates the license.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-500 font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-slate-900 font-semibold mb-1">No Credential Claims</h3>
                  <p className="text-slate-600 text-sm">
                    This license does NOT grant ETPL listing, WIOA provider status, state board recognition, or any compliance authority. 
                    You must obtain credentials independently through proper channels.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-500 font-bold">4</span>
                </div>
                <div>
                  <h3 className="text-slate-900 font-semibold mb-1">No Resale or Distribution</h3>
                  <p className="text-slate-600 text-sm">
                    You may NOT sell, lease, sublicense, or distribute this software or any derivative to any third party. 
                    Violation results in immediate termination and legal action.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-500 font-bold">5</span>
                </div>
                <div>
                  <h3 className="text-slate-900 font-semibold mb-1">Updates Not Guaranteed</h3>
                  <p className="text-slate-600 text-sm">
                    Access to updates requires active compliance with license terms. 
                    Elevate for Humanity may revoke update access for any breach.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <Building2 className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Enterprise Pricing</h2>
            
            <div className="my-6">
              <span className="text-5xl font-black text-slate-900">$75,000</span>
              <span className="text-slate-600 ml-2">starting</span>
              <p className="text-slate-600 text-sm mt-2">
                + 20% annual maintenance (optional but recommended)
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left">
              <h4 className="text-slate-900 font-semibold mb-3">What&apos;s Included</h4>
              <ul className="text-slate-700 text-sm space-y-2">
                <li>• Full source code access for internal deployment</li>
                <li>• 40 hours of implementation support</li>
                <li>• Signed license agreement</li>
                <li>• Annual updates and patches</li>
              </ul>
            </div>

            <Link
              href="/contact?subject=Enterprise%20License%20Inquiry"
              className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-4 rounded-lg transition"
            >
              Request Enterprise License
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Compare License Types</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 px-4 text-slate-600 font-medium">Feature</th>
                  <th className="py-4 px-4 text-brand-blue-600 font-medium">Managed Platform</th>
                  <th className="py-4 px-4 text-slate-600 font-medium">Source-Use</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ['Hosting', 'We host & operate', 'You host (your responsibility)'],
                  ['Updates', 'Automatic', 'Manual (no guarantee)'],
                  ['Support', 'Included', 'Not included'],
                  ['Security & Backups', 'Included', 'Your responsibility'],
                  ['Branding', 'Your branding', 'Your branding + required attribution'],
                  ['Credential add-ons', 'Available', 'Never available'],
                  ['Resale rights', 'No', 'No'],
                  ['Ownership', 'No', 'No'],
                  ['White-label', 'No', 'No'],
                  ['Starting price', '$1,500/mo + $7,500 setup', '$75,000 one-time'],
                ].map(([feature, managed, source]) => (
                  <tr key={feature} className="border-b border-slate-200">
                    <td className="py-4 px-4 text-slate-700">{feature}</td>
                    <td className="py-4 px-4 text-slate-900">{managed}</td>
                    <td className="py-4 px-4 text-slate-600">{source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/store/licensing/managed"
              className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-slate-500 font-medium"
            >
              <Shield className="w-5 h-5" />
              Most organizations should choose Managed Platform →
            </Link>
          </div>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Implementation Timeline</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { week: 'Week 1-2', title: 'Legal & Procurement', desc: 'License agreement review, NDA execution, payment processing, and executive sign-off.' },
              { week: 'Week 3-4', title: 'Repository Access', desc: 'Source code repository access granted. Architecture documentation and deployment guides delivered.' },
              { week: 'Week 5-8', title: 'Implementation Support', desc: '40 hours of implementation support. Infrastructure setup guidance, configuration review, and testing.' },
              { week: 'Ongoing', title: 'Annual Maintenance', desc: 'Quarterly security patches, annual compliance review, and email-based technical support.' },
            ].map((step) => (
              <div key={step.week} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-brand-blue-600 text-xs font-bold uppercase tracking-wide mb-2">{step.week}</div>
                <h3 className="text-slate-900 font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Security & Compliance</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Data Handling', items: ['AES-256 encryption at rest', 'TLS 1.3 in transit', 'No third-party data sharing', 'FERPA-compliant architecture', 'Data Processing Agreement (DPA) available'] },
              { title: 'Infrastructure', items: ['SOC 2 Type II aligned controls', 'Annual penetration testing', 'Automated vulnerability scanning', 'Role-based access control', 'Audit logging on all actions'] },
              { title: 'Compliance', items: ['WIOA reporting templates included', 'FERPA data handling procedures', 'WCAG 2.1 AA accessibility', 'Equal opportunity compliance', 'Quarterly compliance review calls'] },
            ].map((col) => (
              <div key={col.title} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-slate-900 font-semibold mb-4">{col.title}</h3>
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-slate-700 text-sm">
                      <Shield className="w-4 h-4 text-brand-blue-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-600 text-sm mt-6">
            Security documentation and compliance certifications available under NDA.{' '}
            <Link href="/contact?subject=Security%20Documentation%20Request" className="text-brand-blue-600 hover:text-slate-700 underline">Request access</Link>
          </p>
        </div>
      </section>

      {/* Legal Notice */}
      <section className="py-12 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
            <h4 className="text-slate-900 font-semibold mb-3">Attribution Requirement</h4>
            <p className="text-slate-600 text-sm">
              All deployments must retain &quot;Powered by Elevate for Humanity&quot; attribution and trademark notices 
              in the footer, login screen, and about page. Removal of attribution is a material breach 
              and results in immediate license termination.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
            <h4 className="text-slate-900 font-semibold mb-3">Governing Documents</h4>
            <ul className="text-slate-600 text-sm space-y-2">
              <li>• <Link href="/terms-of-service" className="text-brand-blue-600 hover:text-slate-700 underline">Terms of Service</Link></li>
              <li>• <Link href="/privacy-policy" className="text-brand-blue-600 hover:text-slate-700 underline">Privacy Policy</Link></li>
              <li>• <Link href="/admin/governance/data" className="text-brand-blue-600 hover:text-slate-700 underline">Data Processing & Privacy</Link></li>
              <li>• <Link href="/admin/governance/security" className="text-brand-blue-600 hover:text-slate-700 underline">Security Policy</Link></li>
              <li>• <Link href="/accessibility" className="text-brand-blue-600 hover:text-slate-700 underline">Accessibility Statement</Link></li>
              <li>• Enterprise License Agreement (provided during procurement)</li>
            </ul>
          </div>

          <div className="text-center text-slate-600 text-xs space-y-2">
            <p>
              Elevate for Humanity™ and the Elevate logo are trademarks of 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Technical Institute.
            </p>
            <p>
              Source-Use License is subject to full license agreement. Unauthorized use, distribution, 
              rebranding, or credential misrepresentation will result in license termination and legal action.
            </p>
            <p className="pt-4 border-t border-slate-200 mt-4">
              All products are licensed access to platforms operated by Elevate for Humanity. 
              Ownership of software, infrastructure, and intellectual property is not transferred.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
