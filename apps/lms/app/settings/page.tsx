'use client';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { User, Bell, Shield, CreditCard, Users, Globe, Key } from 'lucide-react';
import { useState } from 'react';

export const metadata: Metadata = {
  title: 'Account Settings | Elevate for Humanity',
  description: 'Manage your account settings and preferences.',
};

const settingsSections = [
  {
    icon: User,
    title: 'Profile Information',
    description: 'Update your personal information and contact details.',
    href: '/profile',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Configure how you receive updates and alerts.',
    href: '/settings/notifications',
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    description: 'Manage your password and privacy settings.',
    href: '/settings/security',
  },
  {
    icon: CreditCard,
    title: 'Billing & Payments',
    description: 'View invoices, payment methods, and subscriptions.',
    href: '/billing',
  },
  {
    icon: Users,
    title: 'Connected Accounts',
    description: 'Link your social accounts and third-party services.',
    href: '/settings/accounts',
  },
  {
    icon: Globe,
    title: 'Language & Region',
    description: 'Set your preferred language and timezone.',
    href: '/settings/language',
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs items={[{ label: 'Settings' }]} />
      
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-black">Account Settings</h1>
          <p className="text-slate-600 mt-1">Manage your account preferences and settings.</p>
        </div>
      </section>

      {/* Settings Grid */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settingsSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-brand-blue-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">{section.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{section.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Key className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-amber-900">Keep Your Account Secure</h3>
                <p className="text-sm text-amber-800 mt-1">
                  We recommend using a strong, unique password and enabling two-factor authentication for additional security.
                </p>
                <Link href="/settings/security" className="inline-block mt-3 text-sm font-semibold text-amber-900 hover:text-amber-700">
                  Update Security Settings →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="font-bold text-red-900">Danger Zone</h3>
            <p className="text-sm text-red-800 mt-1 mb-4">
              These actions are permanent and cannot be undone.
            </p>
            <div className="flex gap-4">
              <button className="px-4 py-2 border border-red-300 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors text-sm">
                Download My Data
              </button>
              <button className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

