import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Users, Lock, Key, Eye, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Access Controls | Elevate Security',
  description: 'Role-based access control matrix and user permission levels for the Elevate Workforce Platform.',
  keywords: ['access controls', 'RBAC', 'permissions', 'security', 'authentication'],
};

const roles = [
  {
    name: 'Super Admin',
    description: 'Full platform access including system configuration and user management',
    color: 'bg-red-100 text-red-800',
    permissions: [
      'All system configurations',
      'User management (all roles)',
      'Financial data access',
      'Audit log access',
      'Data export and deletion',
      'API key management',
      'Integration settings',
    ],
  },
  {
    name: 'Admin',
    description: 'Organization-level administration and reporting',
    color: 'bg-purple-100 text-purple-800',
    permissions: [
      'Organization settings',
      'User management (non-admin)',
      'Program management',
      'Reporting and analytics',
      'Student enrollment',
      'Document management',
      'Compliance reports',
    ],
  },
  {
    name: 'Staff/Instructor',
    description: 'Day-to-day training and student support',
    color: 'bg-blue-100 text-blue-800',
    permissions: [
      'Course content management',
      'Student progress tracking',
      'Gradebook access',
      'Announcements',
      'Limited reports',
      'Support ticket management',
    ],
  },
  {
    name: 'Employer',
    description: 'Employer portal for apprenticeship tracking',
    color: 'bg-green-100 text-green-800',
    permissions: [
      'Apprentice progress viewing',
      'OJT hour approvals',
      'Competency sign-offs',
      'Message students/apprentices',
      'Own profile management',
    ],
  },
  {
    name: 'Student/Participant',
    description: 'Learning management system access',
    color: 'bg-slate-100 text-slate-800',
    permissions: [
      'Course enrollment',
      'Lesson completion',
      'Assignment submission',
      'Personal records',
      'Credential downloads',
      'Support requests',
    ],
  },
];

const mfaRequirements = [
  { role: 'Super Admin', required: true },
  { role: 'Admin', required: true },
  { role: 'Staff/Instructor', required: true },
  { role: 'Employer', required: false },
  { role: 'Student/Participant', required: false },
];

export default function AccessControlsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link href="/security" className="hover:text-white">Security</Link>
            <span>/</span>
            <span className="text-white">Access Controls</span>
          </div>
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Key className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-4">Access Control Matrix</h1>
              <p className="text-xl text-slate-300 max-w-2xl">
                Role-based access control (RBAC) ensures users only have access to the data and 
                functionality they need for their role.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MFA Requirements */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Multi-Factor Authentication</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Role</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-900">MFA Required</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Methods Supported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mfaRequirements.map((req) => (
                  <tr key={req.role} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium text-slate-900">{req.role}</td>
                    <td className="py-4 px-6 text-center">
                      {req.required ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                          <Lock className="w-3 h-3" /> Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 text-sm font-semibold rounded-full">
                          Optional
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {req.required ? 'Authenticator App, SMS, Hardware Key' : 'Recommended'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Role Permissions */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Role Permissions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className={`px-6 py-4 ${role.color}`}>
                  <h3 className="font-bold text-lg">{role.name}</h3>
                  <p className="text-sm opacity-80 mt-1">{role.description}</p>
                </div>
                <div className="p-6">
                  <h4 className="text-sm font-bold text-slate-900 mb-3">Permissions:</h4>
                  <ul className="space-y-2">
                    {role.permissions.map((perm) => (
                      <li key={perm} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Controls */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Additional Security Controls</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-slate-600" />
                <h3 className="font-bold text-slate-900">Session Management</h3>
              </div>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Automatic session timeout after 30 minutes of inactivity</li>
                <li>• Concurrent session limits by role</li>
                <li>• Session revocation on role change</li>
                <li>• Secure cookie settings (HttpOnly, Secure, SameSite)</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-slate-600" />
                <h3 className="font-bold text-slate-900">Password Requirements</h3>
              </div>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Minimum 12 characters</li>
                <li>• Mix of uppercase, lowercase, numbers, symbols</li>
                <li>• Password history (last 10 passwords)</li>
                <li>• Breach detection via Have I Been Pwned</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Audit Trail Note */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Audit Trail</h3>
                <p className="text-slate-600 text-sm">
                  All access attempts, permission changes, and data access events are logged with 
                  timestamp, user identity, IP address, and action type. Logs are retained for 
                  7 years and are tamper-evident.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
