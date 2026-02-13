export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, GraduationCap, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'New Lead | CRM | Admin | Elevate For Humanity',
  description: 'Add a new prospective student lead.',
};

export default async function NewLeadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/crm/leads/new');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/crm/leads"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Lead</h1>
          <p className="text-gray-600 mt-1">Enter the prospective student&apos;s information</p>
        </div>

        {/* Form */}
        <form className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Smith"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-400" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(317) 314-3757"
                />
              </div>
            </div>
          </div>

          {/* Program Interest */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-gray-400" />
              Program Interest
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interested Program *
                </label>
                <select
                  name="program"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a program...</option>
                  <optgroup label="Healthcare">
                    <option value="cna">Certified Nursing Assistant (CNA)</option>
                    <option value="medical-admin">Medical Administrative Assistant</option>
                    <option value="phlebotomy">Phlebotomy Technician</option>
                    <option value="emt">Emergency Medical Technician (EMT)</option>
                  </optgroup>
                  <optgroup label="Skilled Trades">
                    <option value="hvac">HVAC Technician</option>
                    <option value="electrical">Electrical Technician</option>
                    <option value="plumbing">Plumbing Technician</option>
                    <option value="welding">Welding Technician</option>
                  </optgroup>
                  <optgroup label="Technology">
                    <option value="it-support">IT Support Specialist</option>
                    <option value="cybersecurity">Cybersecurity Analyst</option>
                  </optgroup>
                  <optgroup label="Business">
                    <option value="business-office">Business Office Administration</option>
                    <option value="accounting">Accounting Fundamentals</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Start Date
                </label>
                <select
                  name="startDate"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select preferred start...</option>
                  <option value="asap">As soon as possible</option>
                  <option value="spring-2025">Spring 2025</option>
                  <option value="summer-2025">Summer 2025</option>
                  <option value="fall-2025">Fall 2025</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lead Source */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Lead Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Source
                </label>
                <select
                  name="source"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="social-media">Social Media</option>
                  <option value="job-fair">Job Fair</option>
                  <option value="community-event">Community Event</option>
                  <option value="workforce-agency">Workforce Agency</option>
                  <option value="phone-inquiry">Phone Inquiry</option>
                  <option value="walk-in">Walk-in</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Status
                </label>
                <select
                  name="status"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="appointment-set">Appointment Set</option>
                  <option value="application-started">Application Started</option>
                </select>
              </div>
            </div>
          </div>

          {/* WIOA Eligibility */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Potential WIOA Eligibility
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="unemployed" className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">Currently unemployed</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="lowIncome" className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">Low income household</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="veteran" className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">Veteran or military spouse</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="dislocatedWorker" className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">Dislocated worker</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any additional notes about this lead..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <Link
              href="/admin/crm/leads"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
