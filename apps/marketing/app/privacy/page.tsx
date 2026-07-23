import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Shield, Lock, Eye, Database, Trash2, Download, Clock,
  Users, FileCheck, AlertTriangle, CheckCircle, ChevronDown,
  ChevronRight, Mail, Phone
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  keywords: ["privacy", "data protection", "FERPA", "student privacy", "data retention", "GDPR"],
  description: 'How we collect, use, and protect your data. Complete transparency on data handling, retention policies, and your rights.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/pages/privacy-hero.webp" alt="" fill className="object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Your Privacy Matters
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Privacy Policy
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-4">
              Last updated: January 15, 2025
            </p>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              We take the protection of your personal data seriously. This policy explains how we collect, 
              use, and safeguard your information while providing workforce development services.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/security" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Security Information
              </Link>
              <Link href="/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Contact Privacy Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-8 bg-slate-50 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <a href="#data-collection" className="text-brand-blue-600 hover:text-brand-blue-700">Data Collection</a>
            <a href="#data-usage" className="text-brand-blue-600 hover:text-brand-blue-700">Data Usage</a>
            <a href="#data-retention" className="text-brand-blue-600 hover:text-brand-blue-700">Data Retention</a>
            <a href="#access-controls" className="text-brand-blue-600 hover:text-brand-blue-700">Access Controls</a>
            <a href="#your-rights" className="text-brand-blue-600 hover:text-brand-blue-700">Your Rights</a>
            <a href="#record-deletion" className="text-brand-blue-600 hover:text-brand-blue-700">Record Deletion</a>
            <a href="#incident-response" className="text-brand-blue-600 hover:text-brand-blue-700">Incident Response</a>
            <a href="#contact" className="text-brand-blue-600 hover:text-brand-blue-700">Contact</a>
          </div>
        </div>
      </section>

      {/* Data We Collect */}
      <section id="data-collection" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Database className="w-8 h-8 text-brand-blue-600" />
            Data We Collect
          </h2>
          <p className="text-lg text-slate-700 mb-8">
            As a workforce development organization, we collect specific data to deliver our services effectively:
          </p>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Student Records</h3>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Personal information (name, address, contact details)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Enrollment history and progress data
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Attendance records
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Transcripts and credentials
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Application Data</h3>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Eligibility documentation
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Funding source information (WIOA, etc.)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Intake forms and assessments
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Apprenticeship Records</h3>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  On-the-Job Learning (OJL) logs
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Related Technical Instruction (RTI) records
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Competency verification
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Host employer information
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Testing & Credentials</h3>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Exam scores and results
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Certification data
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Testing session records
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Payment Information</h3>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Billing addresses
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Funding source records
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Payment history (Stripe-handled, not stored)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Data Usage */}
      <section id="data-usage" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Eye className="w-8 h-8 text-brand-blue-600" />
            How We Use Your Data
          </h2>
          <p className="text-lg text-slate-700 mb-8">
            We use your data exclusively for delivering workforce development services:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Service Delivery</h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Enrollment and registration</li>
                <li>• Course delivery and progress tracking</li>
                <li>• Credential issuance</li>
                <li>• Apprenticeship management</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Compliance & Reporting</h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• DOL apprenticeship reporting</li>
                <li>• WIOA outcome tracking</li>
                <li>• Funding source documentation</li>
                <li>• Audit compliance</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Communication</h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Program announcements</li>
                <li>• Appointment scheduling</li>
                <li>• Financial notifications</li>
                <li>• Career services updates</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Analytics & Improvement</h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Program outcome analysis</li>
                <li>• Service quality improvement</li>
                <li>• Aggregate reporting (de-identified)</li>
                <li>• Research with consent</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>We never sell your data.</strong> Your personal information is never sold, rented, 
                or traded to third parties for marketing purposes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Retention */}
      <section id="data-retention" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Clock className="w-8 h-8 text-brand-blue-600" />
            Data Retention Policy
          </h2>
          <p className="text-lg text-slate-700 mb-8">
            We retain your data only as long as necessary for service delivery and legal compliance:
          </p>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900">Student Records</h3>
                <span className="bg-brand-blue-100 text-brand-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  7 years post-completion
                </span>
              </div>
              <p className="text-slate-600 text-sm">
                Maintained for federal financial aid compliance, apprenticeship documentation, and 
                credential verification purposes.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900">Apprenticeship Records</h3>
                <span className="bg-brand-blue-100 text-brand-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  DOL requirement: 5 years
                </span>
              </div>
              <p className="text-slate-600 text-sm">
                OJL logs, RTI records, and competency documentation retained per Department of Labor 
                apprenticeship regulations.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900">Application Data</h3>
                <span className="bg-brand-blue-100 text-brand-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  3 years
                </span>
              </div>
              <p className="text-slate-600 text-sm">
                Retained for eligibility verification, funding documentation, and audit purposes.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900">Testing Records</h3>
                <span className="bg-brand-blue-100 text-brand-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  Permanent
                </span>
              </div>
              <p className="text-slate-600 text-sm">
                Credentials and certification records are maintained permanently for verification 
                and employer reference purposes.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900">Financial Records</h3>
                <span className="bg-brand-blue-100 text-brand-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  7 years
                </span>
              </div>
              <p className="text-slate-600 text-sm">
                Payment records maintained for tax compliance and funding source reconciliation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Access Controls */}
      <section id="access-controls" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Lock className="w-8 h-8 text-brand-blue-600" />
            Access Controls & Role Permissions
          </h2>
          <p className="text-lg text-slate-700 mb-8">
            We implement strict access controls to ensure only authorized individuals can access your data:
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Role-Based Access</h3>
              <ul className="space-y-3 text-slate-600 text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-brand-blue-600 font-bold text-xs">A</span>
                  </div>
                  <span>Administrators: Full access to organization data</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-brand-blue-600 font-bold text-xs">S</span>
                  </div>
                  <span>Staff: Access to assigned programs only</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-brand-blue-600 font-bold text-xs">I</span>
                  </div>
                  <span>Instructors: Access to enrolled students only</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-brand-blue-600 font-bold text-xs">H</span>
                  </div>
                  <span>Host Shops: Apprenticeship data only</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-brand-blue-600 font-bold text-xs">E</span>
                  </div>
                  <span>Employers: Job placement outcomes only</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Audit Logging</h3>
              <p className="text-slate-600 text-sm mb-4">
                Every access and change to your data is logged:
              </p>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Who accessed the record
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  When access occurred
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  What data was viewed/modified
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Before and after values
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  IP address and device info                  </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Multi-Factor Authentication</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-3xl mb-2">📱</div>
                <p className="text-sm text-slate-600">Authenticator Apps</p>
                <p className="text-xs text-slate-500">TOTP recommended</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-3xl mb-2">📧</div>
                <p className="text-sm text-slate-600">Email Verification</p>
                <p className="text-xs text-slate-500">Backup method</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-3xl mb-2">🔑</div>
                <p className="text-sm text-slate-600">Session Management</p>
                <p className="text-xs text-slate-500">Auto-logout enabled</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section id="your-rights" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-blue-600" />
            Your Rights
          </h2>
          <p className="text-lg text-slate-700 mb-8">
            You have control over your personal data. Here's what you can request:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Access Your Data</h3>
              <p className="text-slate-600 text-sm mb-4">
                Request a complete copy of all personal data we hold about you.
              </p>
              <p className="text-xs text-slate-500">
                Response within 30 days
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Correct Inaccuracies</h3>
              <p className="text-slate-600 text-sm mb-4">
                Request corrections to any inaccurate personal information.
              </p>
              <p className="text-xs text-slate-500">
                Processed within 15 days
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Request Deletion</h3>
              <p className="text-slate-600 text-sm mb-4">
                Request deletion of your personal data (subject to legal retention requirements).
              </p>
              <p className="text-xs text-slate-500">
                Processed within 30 days
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Restrict Processing</h3>
              <p className="text-slate-600 text-sm mb-4">
                Request limited processing of your data for specific purposes.
              </p>
              <p className="text-xs text-slate-500">
                Processed within 15 days
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Record Deletion Process */}
      <section id="record-deletion" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-brand-blue-600" />
            Record Deletion Process
          </h2>
          <p className="text-lg text-slate-700 mb-8">
            When you request data deletion, we follow a strict process:
          </p>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Verification</h3>
                <p className="text-slate-600 text-sm">
                  We verify your identity to ensure the request is legitimate.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Legal Review</h3>
                <p className="text-slate-600 text-sm">
                  We check for any legal hold requirements or regulatory retention mandates 
                  that may affect deletion timing.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Deletion Execution</h3>
                <p className="text-slate-600 text-sm">
                  Personal data is removed from our primary systems and databases.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Backup Purge</h3>
                <p className="text-slate-600 text-sm">
                  Data is purged from backups within the next backup cycle (within 30 days).
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-4">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">✓</div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Confirmation</h3>
                <p className="text-slate-600 text-sm">
                  You receive written confirmation when deletion is complete.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Some data may be retained longer due to legal requirements 
                (e.g., financial records for tax purposes, apprenticeship records for DOL compliance).
                We'll inform you of any such requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Backup & Recovery */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Database className="w-8 h-8 text-brand-blue-600" />
            Backup & Recovery Statement
          </h2>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Backup Schedule</h3>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Daily automated backups</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>30-day retention</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Encrypted storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Geographic redundancy</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Recovery Capabilities</h3>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Point-in-time recovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Individual record restore</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Full system restore</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Disaster recovery site</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Recovery Time Objectives</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-brand-blue-600">1hr</div>
                  <p className="text-sm text-slate-600">RPO</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-brand-blue-600">4hr</div>
                  <p className="text-sm text-slate-600">RTO</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-brand-blue-600">99.9%</div>
                  <p className="text-sm text-slate-600">Uptime</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-brand-blue-600">30day</div>
                  <p className="text-sm text-slate-600">Backup Retention</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Incident Response Policy */}
      <section id="incident-response" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Shield className="w-8 h-8 text-brand-blue-600" />
            Incident Response Policy
          </h2>
          <p className="text-lg text-slate-700 mb-8">
            In the event of a data breach or security incident:
          </p>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Detection & Assessment (Minutes 0-60)</h3>
                  <p className="text-slate-600 text-sm">
                    Automated systems detect anomalies. Security team assesses scope and impact.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Containment (Minutes 60-120)</h3>
                  <p className="text-slate-600 text-sm">
                    Affected systems isolated. Threat neutralized. Additional access blocked.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Notification (Hours 24-72)</h3>
                  <p className="text-slate-600 text-sm">
                    Affected individuals notified per GDPR/CCPA requirements. Regulatory bodies informed as required.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Remediation & Prevention</h3>
                  <p className="text-slate-600 text-sm">
                    Root cause identified. Systems hardened. Measures implemented to prevent recurrence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Questions About Your Data?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Our privacy team is here to help with any questions or requests.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <div className="flex items-center justify-center gap-3">
              <Mail className="w-6 h-6" />
              <span>privacy@elevateforhumanity.org</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Phone className="w-6 h-6" />
              <span>(317) 314-3757</span>
            </div>
          </div>
          <div className="mt-8">
            <Link href="/contact" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}