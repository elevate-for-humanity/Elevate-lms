import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, Building, MapPin } from 'lucide-react';
import { createContactAction } from './actions';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'New Contact | CRM | Admin | Elevate For Humanity',
  description: 'Add a new contact to the CRM.',
};

export default async function NewContactPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const supabase = await createClient();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/crm/contacts"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contacts
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Add New Contact</h1>
          <p className="text-slate-700 mt-1">Enter the contact&apos;s information below</p>
        </div>

        {/* Form */}
        <form
          action={createContactAction}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
        >
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-700" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-slate-700" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="john@elevateforhumanity.org"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder={PLATFORM_DEFAULTS.supportPhone}
                />
              </div>
            </div>
          </div>

          {/* Organization */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-slate-700" />
              Organization
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Company/Organization
                </label>
                <input
                  type="text"
                  name="company"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Job Title</label>
                <input
                  type="text"
                  name="job_title"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="HR Manager"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-700" />
              Address
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="street_address"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-900 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="Indianapolis"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="IN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    name="zip"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="46204"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Type */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-900 mb-1">Contact Type</label>
            <select
              name="type"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            >
              <option value="prospect">Prospect</option>
              <option value="student">Student</option>
              <option value="alumni">Alumni</option>
              <option value="employer">Employer Partner</option>
              <option value="vendor">Vendor</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-900 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              placeholder="Add any additional notes about this contact..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            <Link
              href="/admin/crm/contacts"
              className="px-4 py-2 text-slate-900 hover:text-slate-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Create Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
