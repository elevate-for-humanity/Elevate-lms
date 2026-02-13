import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, Download, ChevronRight, Shield, Lock, Eye, AlertTriangle, Server, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security and Data Protection Statement | Elevate For Humanity',
  description: 'Comprehensive security practices, data handling, and protection measures for the Elevate For Humanity platform.',
};

export default function SecurityStatementPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Security" }]} />
      </div>
<div className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/legal" className="hover:text-white">Legal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Security Statement</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Security and Data Protection Statement</h1>
          <p className="text-gray-300">How we protect your data and maintain platform security</p>
          <div className="flex items-center gap-6 mt-6 text-sm">
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" />EFH-SEC-001</span>
            <span>Version 1.0</span>
            <span>January 2025</span>
            <span>Owner: Data Protection Officer</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="font-medium text-orange-900">Official Security Document</p>
            <p className="text-sm text-orange-700">Authoritative reference for all security and data protection practices.</p>
          </div>
          <a href="/docs/Security_and_Data_Protection_Statement.pdf" download className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            <Download className="w-4 h-4" /> PDF
          </a>
        </div>

        <nav className="bg-gray-50 rounded-lg p-6 mb-10">
          <h2 className="font-semibold mb-4">Contents</h2>
          <ol className="space-y-2 text-sm">
            <li><a href="#purpose" className="text-orange-600 hover:underline">1. Security Purpose & Principles</a></li>
            <li><a href="#data-collected" className="text-orange-600 hover:underline">2. Data Collected</a></li>
            <li><a href="#storage" className="text-orange-600 hover:underline">3. Data Storage & Encryption</a></li>
            <li><a href="#access" className="text-orange-600 hover:underline">4. Access Controls</a></li>
            <li><a href="#retention" className="text-orange-600 hover:underline">5. Data Retention & Deletion</a></li>
            <li><a href="#incident" className="text-orange-600 hover:underline">6. Incident Response</a></li>
            <li><a href="#user-responsibilities" className="text-orange-600 hover:underline">7. User Responsibilities</a></li>
            <li><a href="#contact" className="text-orange-600 hover:underline">8. Contact & Reporting</a></li>
            <li><a href="#versioning" className="text-orange-600 hover:underline">9. Versioning & Review</a></li>
          </ol>
        </nav>

        <section id="purpose" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Shield className="w-6 h-6 text-orange-600" />
            1. Security Purpose & Principles
          </h2>
          <h3 className="text-lg font-semibold mt-6 mb-3">1.1 Purpose</h3>
          <p className="text-gray-700 mb-4">This document defines how Elevate For Humanity protects user data, maintains system security, and responds to security events. It applies to all platform components: main website, LMS, Store, and Supersonic Fast Cash.</p>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">1.2 Security Principles</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Least Privilege:</strong> Users and systems receive minimum access required for their function</li>
            <li><strong>Defense in Depth:</strong> Multiple security layers protect against single points of failure</li>
            <li><strong>Data Minimization:</strong> We collect only data necessary for stated purposes</li>
            <li><strong>Transparency:</strong> Users can understand what data we hold and why</li>
            <li><strong>Accountability:</strong> All data access is logged and auditable</li>
          </ul>
        </section>

        <section id="data-collected" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Eye className="w-6 h-6 text-orange-600" />
            2. Data Collected
          </h2>
          <h3 className="text-lg font-semibold mt-6 mb-3">2.1 By Platform Component</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Main Website</h4>
              <p className="text-gray-700 text-sm">Contact information, application data, eligibility responses, communication preferences</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">LMS</h4>
              <p className="text-gray-700 text-sm">Account credentials, course progress, assessment results, certificates, attendance records</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Store</h4>
              <p className="text-gray-700 text-sm">Billing address, order history, payment method tokens (not full card numbers)</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Supersonic Fast Cash</h4>
              <p className="text-gray-700 text-sm">Tax documents, SSN (encrypted), income information, bank account details for refunds</p>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">2.2 Sensitive Data Classification</h3>
          <table className="w-full border-collapse border mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Data Type</th>
                <th className="border p-3 text-left">Classification</th>
                <th className="border p-3 text-left">Protection Level</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-3">SSN</td><td className="border p-3">Highly Sensitive</td><td className="border p-3">Encrypted at rest, masked in UI</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Payment Data</td><td className="border p-3">Highly Sensitive</td><td className="border p-3">PCI-compliant tokenization via Stripe</td></tr>
              <tr><td className="border p-3">Tax Documents</td><td className="border p-3">Sensitive</td><td className="border p-3">Encrypted storage, access logging</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Academic Records</td><td className="border p-3">Protected</td><td className="border p-3">Role-based access, FERPA compliance</td></tr>
              <tr><td className="border p-3">Contact Info</td><td className="border p-3">Standard</td><td className="border p-3">Standard encryption, access controls</td></tr>
            </tbody>
          </table>
        </section>

        <section id="storage" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Server className="w-6 h-6 text-orange-600" />
            3. Data Storage & Encryption
          </h2>
          <h3 className="text-lg font-semibold mt-6 mb-3">3.1 Infrastructure</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Database:</strong> Supabase (PostgreSQL) with encryption at rest (AES-256)</li>
            <li><strong>File Storage:</strong> Supabase Storage with server-side encryption</li>
            <li><strong>Application Hosting:</strong> Vercel with automatic HTTPS</li>
            <li><strong>Payment Processing:</strong> Stripe (PCI DSS Level 1 certified)</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.2 Encryption Standards</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>In Transit:</strong> TLS 1.3 for all connections</li>
            <li><strong>At Rest:</strong> AES-256 encryption for all stored data</li>
            <li><strong>Passwords:</strong> bcrypt hashing with salt (never stored in plain text)</li>
            <li><strong>Sensitive Fields:</strong> Application-level encryption for SSN, tax data</li>
          </ul>
        </section>

        <section id="access" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Lock className="w-6 h-6 text-orange-600" />
            4. Access Controls
          </h2>
          <h3 className="text-lg font-semibold mt-6 mb-3">4.1 Authentication</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Email/password authentication with secure session management</li>
            <li>Optional two-factor authentication (2FA) for all users</li>
            <li>Required 2FA for Admin and Super Admin roles</li>
            <li>Session timeout after 24 hours of inactivity</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.2 Authorization</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Role-based access control (RBAC) enforced at database level</li>
            <li>Row-level security (RLS) policies on all tables</li>
            <li>API endpoints validate user permissions before data access</li>
            <li>Administrative actions require explicit role verification</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.3 Audit Logging</h3>
          <p className="text-gray-700">All access to sensitive data is logged with: user ID, timestamp, action performed, data accessed, IP address. Logs are retained for 7 years and reviewed monthly.</p>
        </section>

        <section id="retention" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <FileText className="w-6 h-6 text-orange-600" />
            5. Data Retention & Deletion
          </h2>
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Data Type</th>
                <th className="border p-3 text-left">Retention Period</th>
                <th className="border p-3 text-left">Deletion Method</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-3">Account Data</td><td className="border p-3">Duration of account + 3 years</td><td className="border p-3">Anonymization or deletion</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Academic Records</td><td className="border p-3">7 years after completion</td><td className="border p-3">Secure deletion</td></tr>
              <tr><td className="border p-3">Tax Documents</td><td className="border p-3">7 years (IRS requirement)</td><td className="border p-3">Secure deletion</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Payment Records</td><td className="border p-3">7 years (financial compliance)</td><td className="border p-3">Secure deletion</td></tr>
              <tr><td className="border p-3">Audit Logs</td><td className="border p-3">7 years</td><td className="border p-3">Secure deletion</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.1 Deletion Requests</h3>
          <p className="text-gray-700">Users may request data deletion by contacting elevate4humanityedu@gmail.com. Requests are processed within 30 days. Some data may be retained for legal compliance (tax records, financial transactions).</p>
        </section>

        <section id="incident" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            6. Incident Response
          </h2>
          <h3 className="text-lg font-semibold mt-6 mb-3">6.1 Response Process</h3>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Detection:</strong> Automated monitoring and user reports</li>
            <li><strong>Containment:</strong> Isolate affected systems within 1 hour</li>
            <li><strong>Assessment:</strong> Determine scope and impact within 4 hours</li>
            <li><strong>Notification:</strong> Notify affected users within 72 hours if required</li>
            <li><strong>Remediation:</strong> Fix vulnerability and restore services</li>
            <li><strong>Review:</strong> Post-incident analysis and documentation</li>
          </ol>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.2 Breach Notification</h3>
          <p className="text-gray-700">If a data breach affects personal information, we will: notify affected users within 72 hours, notify relevant regulators as required, provide clear information about what data was affected and recommended actions.</p>
        </section>

        <section id="user-responsibilities" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Users className="w-6 h-6 text-orange-600" />
            7. User Responsibilities
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Use strong, unique passwords (minimum 8 characters)</li>
            <li>Enable two-factor authentication when available</li>
            <li>Do not share account credentials</li>
            <li>Report suspicious activity immediately</li>
            <li>Log out from shared devices</li>
            <li>Keep contact information current for security notifications</li>
          </ul>
        </section>

        <section id="contact" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact & Reporting</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="mb-2"><strong>Security Issues:</strong> elevate4humanityedu@gmail.com</p>
            <p className="mb-2"><strong>Privacy Requests:</strong> elevate4humanityedu@gmail.com</p>
            <p className="mb-2"><strong>Data Protection Officer:</strong> elevate4humanityedu@gmail.com</p>
            <p><strong>Phone:</strong> 317-314-3757</p>
          </div>
        </section>

        <section id="versioning" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Versioning & Review</h2>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Version</th><th className="border p-3 text-left">Date</th><th className="border p-3 text-left">Changes</th></tr></thead>
            <tbody><tr><td className="border p-3">1.0</td><td className="border p-3">January 2025</td><td className="border p-3">Initial authoritative version</td></tr></tbody>
          </table>
          <p className="text-gray-700"><strong>Review Schedule:</strong> Annually, or upon significant security events or regulatory changes.</p>
        </section>

        <footer className="mt-12 pt-8 border-t text-sm text-gray-500">
          <p><strong>Document ID:</strong> EFH-SEC-001 | <strong>Owner:</strong> Data Protection Officer</p>
          <p className="mt-2">© 2025 Elevate For Humanity. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
