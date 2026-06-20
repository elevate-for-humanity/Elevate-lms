import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, User, Mail, GraduationCap, Calendar } from 'lucide-react';
import { createLeadAction } from './actions';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'New Lead | CRM | Admin | Elevate For Humanity',
};

export default async function NewLeadPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const supabase = await createClient();

  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, slug')
    .eq('is_active', true)
    .order('title');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/admin/crm/leads" className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Add New Lead</h1>
          <p className="text-slate-600 mt-1">Enter the prospective student&apos;s information</p>
        </div>

        <form action={createLeadAction} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">

          {/* Personal */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">First Name *</label>
                <input type="text" name="first_name" required placeholder="Jane"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Last Name *</label>
                <input type="text" name="last_name" required placeholder="Smith"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" /> Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Email *</label>
                <input type="email" name="email" required placeholder="jane@example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Phone</label>
                <input type="tel" name="phone" placeholder={PLATFORM_DEFAULTS.supportPhone}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
              </div>
            </div>
          </div>

          {/* Program — live from DB */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" /> Program Interest
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Program</label>
                <select name="program_interest"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500">
                  <option value="">Select a program…</option>
                  {(programs ?? []).map((p) => (
                    <option key={p.id} value={p.slug}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Preferred Start</label>
                <select name="startDate"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500">
                  <option value="">Any time</option>
                  <option value="asap">As soon as possible</option>
                  <option value="next-cohort">Next cohort</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lead details */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Lead Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Source</label>
                <select name="source"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500">
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
                <label className="block text-sm font-medium text-slate-900 mb-1">Status</label>
                <select name="status"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="appointment-set">Appointment Set</option>
                  <option value="application-started">Application Started</option>
                </select>
              </div>
            </div>
          </div>

          {/* WIOA */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Potential WIOA Eligibility</label>
            <div className="space-y-2">
              {[
                ['unemployed', 'Currently unemployed'],
                ['lowIncome', 'Low income household'],
                ['veteran', 'Veteran or military spouse'],
                ['dislocatedWorker', 'Dislocated worker'],
              ].map(([name, label]) => (
                <label key={name} className="flex items-center gap-2">
                  <input type="checkbox" name={name} className="rounded border-slate-300" />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Notes</label>
            <textarea name="notes" rows={3} placeholder="Additional notes…"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500" />
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            <Link href="/admin/crm/leads" className="px-4 py-2 text-slate-600 hover:text-slate-900">Cancel</Link>
            <button type="submit"
              className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
