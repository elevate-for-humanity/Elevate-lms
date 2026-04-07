import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create New User | Admin | Elevate For Humanity',
  description: 'Create a new user account.',
};

export default async function NewUserPage() {
  const supabase = await createClient();



  return (
    <div className="min-h-screen bg-white py-8">

      {/* Hero Image */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/users"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Users
          </Link>
          <h1 className="text-3xl font-bold text-black">Create New User</h1>
          <p className="mt-2 text-black">
            Add a new user to the system with appropriate role and permissions.
          </p>
        </div>

        {/* Create User Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">
              User Information
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="First name"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="user@organization.org"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
              />
              <p className="mt-1 text-xs text-black">
                User will receive a verification email at this address
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="(317) 314-3757"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                User Role *
              </label>
              <select
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
              >
                <option value="">Select a role</option>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="program_holder">Program Holder</option>
                <option value="employer">Employer</option>
              </select>
              <p className="mt-1 text-xs text-black">
                Role determines user permissions and access level
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Temporary Password *
              </label>
              <input
                type="password"
                required
                placeholder="Enter temporary password"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
              />
              <p className="mt-1 text-xs text-black">
                User will be required to change password on first login
              </p>
            </div>

            {/* Additional Options */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-brand-blue-600"
                />
                <span className="text-sm text-black">
                  Send welcome email
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-brand-blue-600"
                />
                <span className="text-sm text-black">
                  Require password change on first login
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-brand-blue-600"
                />
                <span className="text-sm text-black">
                  Account active immediately
                </span>
              </label>
            </div>

            {/* Program Assignment (for students) */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-black mb-2">
                Assign to Program (Optional)
              </label>
              <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500">
                <option value="">No program assignment</option>
                <option value="barber">Barber Training</option>
                <option value="cna">CNA</option>
                <option value="hvac">HVAC</option>
                <option value="medical">Medical Assistant</option>
                <option value="cdl">CDL Training</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Add any notes about this user..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <Link
                href="/admin/users"
                className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button className="px-6 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700 font-semibold" aria-label="Action button">
                Create User
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-brand-blue-900 mb-2">
            Creating User Accounts
          </h3>
          <ul className="text-sm text-brand-blue-800 space-y-1">
            <li>
              • Users will receive a verification email to activate their
              account
            </li>
            <li>• Temporary passwords must be changed on first login</li>
            <li>
              • Role determines what features and data the user can access
            </li>
            <li>• You can edit user details and permissions after creation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
