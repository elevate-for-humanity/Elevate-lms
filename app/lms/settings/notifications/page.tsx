
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Calendar,
  GraduationCap,
  DollarSign,
  Save,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface NotificationSettings {
  email: {
    course_updates: boolean;
    assignment_reminders: boolean;
    grade_posted: boolean;
    instructor_messages: boolean;
    career_opportunities: boolean;
    billing_alerts: boolean;
    weekly_digest: boolean;
  };
  push: {
    course_updates: boolean;
    assignment_reminders: boolean;
    grade_posted: boolean;
    instructor_messages: boolean;
    live_sessions: boolean;
  };
  sms: {
    urgent_alerts: boolean;
    appointment_reminders: boolean;
    payment_reminders: boolean;
  };
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      course_updates: true,
      assignment_reminders: true,
      grade_posted: true,
      instructor_messages: true,
      career_opportunities: true,
      billing_alerts: true,
      weekly_digest: false,
    },
    push: {
      course_updates: true,
      assignment_reminders: true,
      grade_posted: true,
      instructor_messages: true,
      live_sessions: true,
    },
    sms: {
      urgent_alerts: true,
      appointment_reminders: true,
      payment_reminders: false,
    },
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login?next=/lms/settings/notifications');
      return;
    }
    
    // Load saved settings from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();
    
    if (profile?.notification_preferences) {
      setSettings(profile.notification_preferences as NotificationSettings);
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ notification_preferences: settings })
        .eq('id', user.id);
    }
    
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateEmailSetting = (key: keyof NotificationSettings['email'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value }
    }));
  };

  const updatePushSetting = (key: keyof NotificationSettings['push'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      push: { ...prev.push, [key]: value }
    }));
  };

  const updateSmsSetting = (key: keyof NotificationSettings['sms'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      sms: { ...prev.sms, [key]: value }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'LMS', href: '/lms' }, { label: 'Settings', href: '/lms/settings' }, { label: 'Notifications' }]} />
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
              <p className="text-gray-600 mt-1">Manage how you receive notifications</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <>
                  <Bell className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Email Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Course Updates</p>
                  <p className="text-sm text-gray-500">New content, announcements, and changes</p>
                </div>
              </div>
              <Toggle checked={settings.email.course_updates} onChange={(v) => updateEmailSetting('course_updates', v)} />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Assignment Reminders</p>
                  <p className="text-sm text-gray-500">Upcoming due dates and deadlines</p>
                </div>
              </div>
              <Toggle checked={settings.email.assignment_reminders} onChange={(v) => updateEmailSetting('assignment_reminders', v)} />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Grade Posted</p>
                  <p className="text-sm text-gray-500">When instructors post grades or feedback</p>
                </div>
              </div>
              <Toggle checked={settings.email.grade_posted} onChange={(v) => updateEmailSetting('grade_posted', v)} />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Instructor Messages</p>
                  <p className="text-sm text-gray-500">Direct messages from instructors</p>
                </div>
              </div>
              <Toggle checked={settings.email.instructor_messages} onChange={(v) => updateEmailSetting('instructor_messages', v)} />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Billing Alerts</p>
                  <p className="text-sm text-gray-500">Payment confirmations and reminders</p>
                </div>
              </div>
              <Toggle checked={settings.email.billing_alerts} onChange={(v) => updateEmailSetting('billing_alerts', v)} />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Weekly Digest</p>
                  <p className="text-sm text-gray-500">Summary of your weekly activity</p>
                </div>
              </div>
              <Toggle checked={settings.email.weekly_digest} onChange={(v) => updateEmailSetting('weekly_digest', v)} />
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Push Notifications</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Course Updates</p>
                <p className="text-sm text-gray-500">Real-time course notifications</p>
              </div>
              <Toggle checked={settings.push.course_updates} onChange={(v) => updatePushSetting('course_updates', v)} />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Assignment Reminders</p>
                <p className="text-sm text-gray-500">Push reminders for deadlines</p>
              </div>
              <Toggle checked={settings.push.assignment_reminders} onChange={(v) => updatePushSetting('assignment_reminders', v)} />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Live Sessions</p>
                <p className="text-sm text-gray-500">Alerts when live sessions start</p>
              </div>
              <Toggle checked={settings.push.live_sessions} onChange={(v) => updatePushSetting('live_sessions', v)} />
            </div>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">SMS Notifications</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Urgent Alerts</p>
                <p className="text-sm text-gray-500">Critical updates and emergencies</p>
              </div>
              <Toggle checked={settings.sms.urgent_alerts} onChange={(v) => updateSmsSetting('urgent_alerts', v)} />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Appointment Reminders</p>
                <p className="text-sm text-gray-500">Reminders for scheduled appointments</p>
              </div>
              <Toggle checked={settings.sms.appointment_reminders} onChange={(v) => updateSmsSetting('appointment_reminders', v)} />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Payment Reminders</p>
                <p className="text-sm text-gray-500">SMS reminders for upcoming payments</p>
              </div>
              <Toggle checked={settings.sms.payment_reminders} onChange={(v) => updateSmsSetting('payment_reminders', v)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
