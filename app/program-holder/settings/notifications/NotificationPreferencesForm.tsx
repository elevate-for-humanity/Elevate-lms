"use client";

import React from 'react';

import { useState } from 'react';
import { Bell, Mail, MessageSquare, Check, X } from 'lucide-react';

interface NotificationPreferences {
  email_enabled?: boolean;
  sms_enabled?: boolean;
  phone_e164?: string;
  sms_consent?: boolean;
  sms_opt_out?: boolean;
}

export default function NotificationPreferencesForm({
  programHolderId,
  initialPreferences,
}: {
  programHolderId: string;
  initialPreferences: NotificationPreferences;
}) {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch(
        '/api/program-holder/notification-preferences',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_holder_id: programHolderId,
            ...preferences,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) { /* Error handled silently */ 
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* In-App Notifications */}
      <div className="flex items-start gap-4">
        <Bell className="w-6 h-6 text-brand-blue-600 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-black mb-1">
            In-App Notifications
          </h3>
          <p className="text-sm text-black mb-2">
            Always enabled. You'll see notifications in your dashboard.
          </p>
          <div className="flex items-center gap-2 text-sm text-brand-green-600">
            <Check className="w-4 h-4" />
            <span>Enabled (cannot be disabled)</span>
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Email Notifications */}
      <div className="flex items-start gap-4">
        <Mail className="w-6 h-6 text-brand-blue-600 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-black mb-1">
            Email Notifications
          </h3>
          <p className="text-sm text-black mb-3">
            Receive email alerts when students enroll or complete milestones.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.email_enabled !== false}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  email_enabled: e.target.checked,
                })
              }
              className="w-5 h-5 text-brand-blue-600 rounded border-gray-300 focus:ring-brand-blue-500"
            />
            <span className="text-sm font-medium text-black">
              Enable email notifications
            </span>
          </label>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* SMS Notifications */}
      <div className="flex items-start gap-4">
        <MessageSquare className="w-6 h-6 text-brand-blue-600 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-black mb-1">
            SMS Notifications
          </h3>
          <p className="text-sm text-black mb-3">
            Receive text message alerts for urgent updates. Requires consent.
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.sms_enabled === true}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    sms_enabled: e.target.checked,
                  })
                }
                disabled={!preferences.sms_consent}
                className="w-5 h-5 text-brand-blue-600 rounded border-gray-300 focus:ring-brand-blue-500 disabled:opacity-50"
              />
              <span className="text-sm font-medium text-black">
                Enable SMS notifications
              </span>
            </label>

            <div className="pl-8 space-y-2">
              <input
                type="tel"
                placeholder="+1 (317) 314-3757"
                value={preferences.phone_e164 || ''}
                onChange={(e) =>
                  setPreferences({ ...preferences, phone_e164: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.sms_consent === true}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      sms_consent: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-brand-blue-600 rounded border-gray-300 focus:ring-brand-blue-500 mt-0.5"
                />
                <span className="text-xs text-black">
                  I consent to receive SMS notifications at this number. Message
                  and data rates may apply. Reply STOP to opt out.
                </span>
              </label>

              {preferences.sms_opt_out && (
                <div className="flex items-center gap-2 text-sm text-brand-red-600">
                  <X className="w-4 h-4" />
                  <span>You have opted out of SMS notifications</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-black">
          Changes take effect immediately after saving.
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
