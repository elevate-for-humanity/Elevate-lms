import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Eye,
  FileCheck,
  AlertTriangle,
  Mail,
  Server,
  Key,
  Phone,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/security',
  },
  title: 'Security & Data Protection | Elevate For Humanity',
  description:
    'Your information is protected. Your trust matters. Learn about our security measures and data protection practices.',
};

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
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

  // Get security certifications/attestations
  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .or('category.eq.security,type.eq.security_attestation')
    .eq('is_active', true);

  // Get last security audit date
  const { data: auditInfo } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'last_security_audit')
    .single();

  const securityMeasures = [
    {
      icon: Lock,
      title: 'Encryption',
      description: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256)',
    },
    {
      icon: Key,
      title: 'Access Control',
      description: 'Role-based access control with multi-factor authentication',
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      description: 'Hosted on SOC 2 compliant cloud infrastructure',
    },
    {
      icon: Eye,
      title: 'Monitoring',
      description: '24/7 security monitoring and intrusion detection',
    },
    {
      icon: FileCheck,
      title: 'Compliance',
      description: 'FERPA compliant for educational records protection',
    },
    {
      icon: Shield,
      title: 'Regular Audits',
      description: 'Annual third-party security assessments and penetration testing',
    },
  ];



  const dataProtection = [
    'We collect only information necessary for program coordination and compliance',
    'Personal data is never sold to third parties',
    'You can request access to or deletion of your data at any time',
    'Data retention follows federal and state requirements',
    'Staff access is limited to job-related needs',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Security' }]} />
        </div>
      </div>

      <div className="py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-10 h-10 text-brand-blue-600" />
          <h1 className="text-4xl font-bold text-black">
            Security & Data Protection
          </h1>
        </div>

        <div className="bg-brand-blue-50 border-l-4 border-brand-blue-600 p-6 mb-8">
          <p className="text-xl font-semibold text-black">
            Your information is protected. Your trust matters.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <p className="text-lg text-black leading-relaxed mb-6">
            Elevate for Humanity takes data security and privacy seriously. Our
            platform is designed to protect personal, educational, and
            workforce-related information using industry-standard safeguards and
            access controls.
          </p>

          <p className="text-lg text-black leading-relaxed">
            We collect only the information necessary to support program
            coordination, advising, reporting, and compliance.
          </p>
        </div>

        {/* Security Measures */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Security Measures</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {securityMeasures.map((measure, index) => {
              const Icon = measure.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                  <Icon className="w-8 h-8 text-brand-blue-600 mb-3" />
                  <h3 className="font-bold text-lg mb-2">{measure.title}</h3>
                  <p className="text-gray-600">{measure.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Data Protection */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Data Protection Practices</h2>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <ul className="space-y-4">
              {dataProtection.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Security Certifications from DB */}
        {certifications && certifications.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Security Certifications & Compliance</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certifications.map((cert: any) => (
                <div key={cert.id} className="bg-white rounded-lg shadow-sm p-6 border-2 border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <Shield className="w-8 h-8 text-brand-blue-600" />
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      cert.status === 'active' || cert.is_active
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-brand-blue-100 text-brand-blue-700'
                    }`}>
                      {cert.status === 'active' || cert.is_active ? 'Compliant' : cert.status || 'Pending'}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{cert.name}</h3>
                  {cert.description && (
                    <p className="text-sm text-gray-600 mb-2">{cert.description}</p>
                  )}
                  {cert.valid_until && (
                    <p className="text-xs text-gray-500">
                      Valid until {new Date(cert.valid_until).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Report a Concern */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            Report a Security Concern
          </h2>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <p className="text-gray-700 mb-4">
              If you believe you've discovered a security vulnerability or have
              concerns about data protection, please contact us immediately:
            </p>
            <a
              href="mailto:info@elevateforhumanity.org"
              className="inline-flex items-center gap-2 text-brand-blue-600 font-medium hover:underline"
            >
              <Mail className="w-5 h-5" />
              info@elevateforhumanity.org
            </a>
          </div>
        </section>

        {/* Related Policies */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Related Policies</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/privacy"
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition"
            >
              <h3 className="font-semibold">Privacy Policy</h3>
              <p className="text-sm text-gray-600">How we collect and use data</p>
            </Link>
            <Link
              href="/terms"
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition"
            >
              <h3 className="font-semibold">Terms of Service</h3>
              <p className="text-sm text-gray-600">Platform usage terms</p>
            </Link>
            <Link
              href="/cookies"
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition"
            >
              <h3 className="font-semibold">Cookie Policy</h3>
              <p className="text-sm text-gray-600">How we use cookies</p>
            </Link>
          </div>
        </section>

        {/* Last Updated */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Last security audit: {auditInfo?.value || 'January 2025'}</p>
          <p>This page was last updated: January 2025</p>
        </div>
      </div>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Visit Support Center
            </a>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
