
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Users, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'New Campaign | Admin | Elevate For Humanity',
  description: 'Create a new marketing campaign.',
};

export default async function NewCampaignPage() {
  const supabase = await createClient();

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            href="/admin/campaigns"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="text-gray-600 mt-1">Set up a new marketing campaign</p>
        </div>

        <form className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              placeholder="Spring 2025 Enrollment Drive"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'sms', label: 'SMS', icon: MessageSquare },
                { id: 'social', label: 'Social', icon: Users },
                { id: 'event', label: 'Event', icon: Calendar },
              ].map((type) => (
                <label key={type.id} className="relative cursor-pointer">
                  <input type="radio" name="campaign_type" value={type.id} className="peer sr-only" defaultChecked={type.id === 'email'} />
                  <div className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg peer-checked:border-brand-blue-500 peer-checked:bg-brand-blue-50">
                    <type.icon className="w-6 h-6 text-gray-600 peer-checked:text-brand-blue-600" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject Line *
            </label>
            <input
              type="text"
              name="subject"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              placeholder="Start Your New Career Today!"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              name="content"
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              placeholder="Write your campaign message..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule (Optional)
            </label>
            <input
              type="datetime-local"
              name="scheduled_at"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Leave empty to save as draft</p>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <Link href="/admin/campaigns" className="px-4 py-2 text-gray-700 hover:text-gray-900">
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
