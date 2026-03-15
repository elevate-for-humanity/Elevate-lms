import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, User, CreditCard, LogOut } from 'lucide-react';
import SettingsForm from './SettingsForm';

export const metadata: Metadata = {
  title: 'Settings | Elevate For Humanity',
  description: 'Manage your account settings.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/settings');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch user preferences if they exist
  const { data: preferences } = await db
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-brand-orange-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Settings</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <nav className="bg-white rounded-xl border p-2">
              {settingsSections.map(section => (
                <button key={section.id} onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                    activeSection === section.id ? 'bg-brand-orange-50 text-brand-orange-600' : 'hover:bg-white'
                  }`}>
                  <section.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{section.name}</span>
                </button>
              ))}
              <hr className="my-2" />
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-brand-red-600 hover:bg-brand-red-50">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </nav>
          </div>

          <div className="md:col-span-3">
            <div className="bg-white rounded-xl border p-6">
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Profile Settings</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-brand-orange-100 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-brand-orange-600" />
                    </div>
                    <button className="px-4 py-2 border rounded-lg hover:bg-white">Change Photo</button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input type="text" defaultValue="John" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input type="text" defaultValue="Doe" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" defaultValue="" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Tell us about yourself..." />
                    </div>
                  </div>
                  <button className="px-6 py-2 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600">Save Changes</button>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Notification Preferences</h2>
                  {['Email notifications', 'Push notifications', 'Course updates', 'Marketing emails', 'Weekly digest'].map(item => (
                    <label key={item} className="flex items-center justify-between py-3 border-b">
                      <span>{item}</span>
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-brand-orange-500" />
                    </label>
                  ))}
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Security Settings</h2>
                  <div>
                    <h3 className="font-medium mb-2">Change Password</h3>
                    <div className="space-y-3">
                      <input type="password" placeholder="Current password" className="w-full px-3 py-2 border rounded-lg" />
                      <input type="password" placeholder="New password" className="w-full px-3 py-2 border rounded-lg" />
                      <input type="password" placeholder="Confirm new password" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600 mb-3">Add an extra layer of security to your account</p>
                    <button className="px-4 py-2 border rounded-lg hover:bg-white">Enable 2FA</button>
                  </div>
                </div>
              )}

              {activeSection === 'billing' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Billing & Payments</h2>
                  <div className="bg-white rounded-lg p-4">
                    <p className="font-medium">Current Plan: <span className="text-brand-orange-600">Pro</span></p>
                    <p className="text-sm text-gray-600">$29/month, renews on Feb 15, 2024</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Payment Method</h3>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <CreditCard className="w-6 h-6 text-gray-400" />
                      <span>•••• •••• •••• 4242</span>
                      <span className="text-sm text-gray-500">Expires 12/25</span>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'language' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Language & Region</h2>
                  <p className="text-gray-600">Choose your preferred language and regional settings</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select className="w-full p-3 border rounded-lg">
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select className="w-full p-3 border rounded-lg">
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Appearance</h2>
                  <p className="text-gray-600">Customize how the application looks</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-white">
                          <input type="radio" name="theme" value="light" defaultChecked />
                          <span>Light</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-white">
                          <input type="radio" name="theme" value="dark" />
                          <span>Dark</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-white">
                          <input type="radio" name="theme" value="system" />
                          <span>System</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Privacy</h2>
                  <p className="text-gray-600">Manage your privacy settings</p>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Profile Visibility</p>
                        <p className="text-sm text-gray-500">Allow others to see your profile</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </label>
                    <label className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Show Progress</p>
                        <p className="text-sm text-gray-500">Display your learning progress publicly</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5" />
                    </label>
                    <label className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Marketing Emails</p>
                        <p className="text-sm text-gray-500">Receive promotional emails</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5" />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
