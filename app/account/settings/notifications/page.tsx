import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Notification Settings | Account | Elevate For Humanity',
  description: 'Manage your notification preferences.',
};

export default async function NotificationSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/account/settings/notifications');
  }

  // Fetch user's notification preferences
  const { data: preferences } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Default values if no preferences exist
  const prefs = preferences || {
    email_course_updates: true,
    email_grades: true,
    email_deadlines: true,
    email_messages: true,
    email_newsletter: true,
    push_messages: true,
    push_reminders: true,
    push_announcements: true,
    sms_urgent: false,
    sms_reminders: false,
    sms_phone: '',
    in_app_all: true,
    in_app_sound: true,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Account', href: '/account' }, { label: 'Settings', href: '/account/settings' }, { label: 'Notifications' }]} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/account/settings"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600 mt-1">Choose how you want to be notified</p>
        </div>

        {/* Notification Preferences */}
        <form action="/api/account/notifications" method="POST" className="space-y-6">
          {/* Email Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
                <p className="text-sm text-gray-500">Notifications sent to {user.email}</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { id: 'email_course_updates', label: 'Course updates and announcements', description: 'New lessons, assignments, and course changes', defaultChecked: prefs.email_course_updates },
                { id: 'email_grades', label: 'Grade notifications', description: 'When grades are posted or updated', defaultChecked: prefs.email_grades },
                { id: 'email_deadlines', label: 'Deadline reminders', description: 'Upcoming assignment and exam deadlines', defaultChecked: prefs.email_deadlines },
                { id: 'email_messages', label: 'Direct messages', description: 'Messages from instructors and classmates', defaultChecked: prefs.email_messages },
                { id: 'email_newsletter', label: 'Newsletter and updates', description: 'News, events, and career opportunities', defaultChecked: prefs.email_newsletter },
              ].map((item) => (
                <div key={item.id} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name={item.id} defaultChecked={item.defaultChecked} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Push Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Push Notifications</h2>
                <p className="text-sm text-gray-500">Browser and desktop notifications</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { id: 'push_messages', label: 'New messages', description: 'Instant alerts for new messages', defaultChecked: prefs.push_messages },
                { id: 'push_reminders', label: 'Class reminders', description: 'Reminders before live sessions', defaultChecked: prefs.push_reminders },
                { id: 'push_announcements', label: 'Important announcements', description: 'Urgent updates from instructors', defaultChecked: prefs.push_announcements },
              ].map((item) => (
                <div key={item.id} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name={item.id} defaultChecked={item.defaultChecked} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">SMS Notifications</h2>
                <p className="text-sm text-gray-500">Text message alerts (standard rates may apply)</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="sms_phone"
                  defaultValue={prefs.sms_phone || ''}
                  placeholder="(317) 314-3757"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {[
                { id: 'sms_urgent', label: 'Urgent alerts only', description: 'Class cancellations and emergencies', defaultChecked: prefs.sms_urgent },
                { id: 'sms_reminders', label: 'Appointment reminders', description: 'Upcoming appointments and meetings', defaultChecked: prefs.sms_reminders },
              ].map((item) => (
                <div key={item.id} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name={item.id} defaultChecked={item.defaultChecked} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* In-App Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">In-App Notifications</h2>
                <p className="text-sm text-gray-500">Notifications within the platform</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { id: 'in_app_all', label: 'All activity', description: 'Show all notifications in the app', defaultChecked: prefs.in_app_all },
                { id: 'in_app_sound', label: 'Notification sounds', description: 'Play sounds for new notifications', defaultChecked: prefs.in_app_sound },
              ].map((item) => (
                <div key={item.id} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name={item.id} defaultChecked={item.defaultChecked} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Link
              href="/account/settings"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
