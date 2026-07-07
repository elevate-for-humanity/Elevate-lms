import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Shield, Lock, Eye, Server, Database, Users, FileCheck, 
  Clock, AlertTriangle, CheckCircle, RefreshCw, HardDrive,
  Activity, Fingerprint, Key, ShieldCheck, Building
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security & Compliance | Elevate for Humanity',
  keywords: ["security", "data protection", "privacy", "FERPA", "HIPAA", "compliance", "encryption", "SOC 2"],
  description: 'Enterprise-grade security for workforce development. FERPA-compliant student data protection, role-based access controls, audit logging, and incident response.',
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/pages/secure-server.webp" alt="" fill className="object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Enterprise-Grade Security
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Your Data Security Is Our Foundation
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Built from the ground up for workforce development organizations. We protect student records, 
              apprenticeship data, and sensitive employment information with enterprise-grade security.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Request Security Documentation
              </Link>
              <Link href="/trust" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                View Compliance Reports
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
              <ShieldCheck className="w-8 h-8 text-brand-blue-600" />
              <span className="font-semibold text-slate-700">FERPA Compliant</span>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-brand-blue-600" />
              <span className="font-semibold text-slate-700">256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-brand-blue-600" />
              <span className="font-semibold text-slate-700">SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-brand-blue-600" />
              <span className="font-semibold text-slate-700">99.9% Uptime SLA</span>
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
              We protect the sensitive data you entrust to us with multiple layers of security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Lock className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Encryption at Rest</h3>
              <p className="text-slate-600 mb-4">
                All student records, documents, and sensitive data are encrypted using AES-256 encryption 
                when stored in our database.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Database-level encryption
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  File storage encryption
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Backup encryption
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Encryption in Transit</h3>
              <p className="text-slate-600 mb-4">
                All data transmitted between your users and our servers is protected with TLS 1.3 encryption.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  TLS 1.3 protocol
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Certificate pinning
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Perfect forward secrecy
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Fingerprint className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Factor Authentication</h3>
              <p className="text-slate-600 mb-4">
                Secure access with MFA for all admin users and optional enforcement for students and staff.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  TOTP authenticator apps
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  SMS backup codes
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Session management
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Key className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Role-Based Access Control</h3>
              <p className="text-slate-600 mb-4">
                Granular permissions control exactly who can view, edit, or delete sensitive data.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Custom role definitions
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Field-level permissions
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Department separation
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Audit Logging</h3>
              <p className="text-slate-600 mb-4">
                Complete track of who accessed what data, when, and what changes were made.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  All data access logged
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Change history tracking
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Export for compliance
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <FileCheck className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Data Retention</h3>
              <p className="text-slate-600 mb-4">
                Configurable retention policies ensure you meet regulatory requirements.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Custom retention periods
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Automated purging
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Legal hold support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure Security */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Infrastructure Security
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-8">
                Our infrastructure is built on enterprise-grade cloud services with multiple layers of 
                security to protect your data.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Server className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Cloud-Native Architecture</h4>
                    <p className="text-slate-600">Hosted on secure cloud infrastructure with automatic scaling and redundancy.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HardDrive className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Daily Backups</h4>
                    <p className="text-slate-600">Automatic daily backups with 30-day retention and point-in-time recovery.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">24/7 Monitoring</h4>
                    <p className="text-slate-600">Continuous security monitoring with automated threat detection and alerting.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Disaster Recovery</h4>
                    <p className="text-slate-600">Geographic redundancy with RTO of 4 hours and RPO of 1 hour.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Building className="w-6 h-6 text-brand-blue-600" />
                Compliance Certifications
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-brand-blue-600 mb-1">FERPA</div>
                  <p className="text-sm text-slate-600">Student Privacy</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-brand-blue-600 mb-1">SOC 2</div>
                  <p className="text-sm text-slate-600">Type II Certified</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-brand-blue-600 mb-1">PCI</div>
                  <p className="text-sm text-slate-600">DSS Compliant</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-brand-blue-600 mb-1">GDPR</div>
                  <p className="text-sm text-slate-600">Ready</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Need specific compliance documentation? Contact our team for SOC 2 reports, 
                    pen test results, or custom security questionnaires.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Incident Response
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              In the unlikely event of a security incident, we have a proven response process.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div className="pt-4">
                <Clock className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Detection</h3>
                <p className="text-slate-600 text-sm">
                  Automated systems detect anomalies within minutes. Security team notified immediately.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div className="pt-4">
                <AlertTriangle className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Containment</h3>
                <p className="text-slate-600 text-sm">
                  Affected systems isolated within 15 minutes. Impact contained and threat neutralized.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div className="pt-4">
                <Users className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Notification</h3>
                <p className="text-slate-600 text-sm">
                  Affected customers notified within 72 hours per GDPR/CCPA requirements.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
              <div className="pt-4">
                <Shield className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Remediation</h3>
                <p className="text-slate-600 text-sm">
                  Full investigation completed. Root cause addressed. Measures implemented to prevent recurrence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data You Hold Section */}
      <section className="py-20 bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What We Protect For You
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              The platform is designed specifically for workforce development organizations that handle sensitive data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Student Records</h3>
              <p className="text-blue-100 text-sm">
                Personal information, enrollment history, transcripts, and academic records protected under FERPA.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Applications</h3>
              <p className="text-blue-100 text-sm">
                Application data, eligibility information, intake forms, and supporting documentation.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Documents</h3>
              <p className="text-blue-100 text-sm">
                Uploads, signed agreements, credentials, and file attachments with encrypted storage.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Apprenticeship Records</h3>
              <p className="text-blue-100 text-sm">
                OJL logs, RTI records, competency tracking, and hour verification for DOL compliance.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Testing Information</h3>
              <p className="text-blue-100 text-sm">
                Exam scores, certifications, credentials, and testing session data.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Payment Data</h3>
              <p className="text-blue-100 text-sm">
                Payment records, funding sources, billing history with PCI-compliant handling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Need More Security Details?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Request our security whitepaper, SOC 2 report, or speak with our security team about your requirements.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Security Team
            </Link>
            <Link href="/privacy" className="inline-flex items-center border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-bold py-4 px-8 rounded-lg transition-colors">
              View Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
