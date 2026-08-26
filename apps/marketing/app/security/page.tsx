import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Shield, Lock, Eye, Server, Database, Users, FileCheck,
  Clock, AlertTriangle, CheckCircle, HardDrive, Building
} from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Security & Compliance',
  keywords: ["security", "data protection", "privacy", "FERPA", "compliance", "encryption"],
  description: 'Security practices for workforce development. FERPA-compliant student data protection, role-based access controls, and incident response.',
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/beauty/barber-hero.webp" alt="Secure server infrastructure" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Security & Data Protection
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Your Data Security Is Our Foundation
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Built for workforce development organizations. We protect student records,
              apprenticeship data, and employment information with industry-standard security practices.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Contact Us About Security
              </Link>
              <Link href="/legal/privacy" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-brand-blue-600" />
              <span className="font-semibold text-slate-700">FERPA Compliant</span>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-brand-blue-600" />
              <span className="font-semibold text-slate-700">Data Encryption</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-brand-blue-600" />
              <span className="font-semibold text-slate-700">Access Controls</span>
            </div>
            <div className="flex items-center gap-3">
              <FileCheck className="w-8 h-8 text-brand-blue-600" />
              <span className="font-semibold text-slate-700">Audit Logging</span>
            </div>
          </div>
        </div>
      </section>

      {/* Data Protection Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Data Protection
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We implement multiple layers of security to protect sensitive information.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-xl p-8">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Lock className="w-7 h-7 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Encryption</h3>
              <p className="text-slate-600">
                Data is encrypted in transit using TLS/SSL. Sensitive data at rest uses encryption
                to protect against unauthorized access.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-8">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Access Controls</h3>
              <p className="text-slate-600">
                Role-based access controls ensure that only authorized personnel can access
                sensitive student and program data.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-8">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-6">
                <FileCheck className="w-7 h-7 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Audit Logging</h3>
              <p className="text-slate-600">
                We maintain logs of data access and modifications for accountability
                and compliance purposes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FERPA Compliance */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                FERPA Student Privacy
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                {PLATFORM_DEFAULTS.orgName} complies with the Family Educational Rights and Privacy Act (FERPA),
                which protects the privacy of student education records.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Student records are only shared with authorized parties</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Parents and eligible students have access rights</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Directory information can be controlled by families</span>
                </li>
              </ul>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image
                src="/images/pages/student-support-hero.webp"
                alt="Student privacy and data protection"
                fill
                className="object-cover" sizes="100vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Security Measures
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Our technical and administrative safeguards protect your information.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <HardDrive className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Secure Infrastructure</h3>
              <p className="text-slate-600 text-sm">
                Cloud hosting with security-focused infrastructure providers.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <Database className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Data Backup</h3>
              <p className="text-slate-600 text-sm">
                Regular backups ensure data can be recovered if needed.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <AlertTriangle className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Incident Response</h3>
              <p className="text-slate-600 text-sm">
                Procedures in place to respond to security incidents.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <Eye className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Monitoring</h3>
              <p className="text-slate-600 text-sm">
                Systems are monitored for unusual activity.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <Clock className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Regular Updates</h3>
              <p className="text-slate-600 text-sm">
                Software and systems are kept current with security patches.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <Building className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Staff Training</h3>
              <p className="text-slate-600 text-sm">
                Staff receive training on data protection practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Have Questions About Security?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Contact us to learn more about our security practices or to request documentation.
          </p>
          <Link href="/contact" className="inline-flex items-center bg-white text-brand-blue-700 font-bold py-4 px-8 rounded-lg hover:bg-blue-50 transition-colors">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
