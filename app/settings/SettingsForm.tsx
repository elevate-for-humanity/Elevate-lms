'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Bell, Lock, CreditCard, Globe, Palette, Shield, LogOut, Save } from 'lucide-react';

interface Props {
  profile: any;
  preferences: any;
  userEmail: string;
}

const settingsSections = [
  { id: 'profile', name: 'Profile', icon: User, description: 'Manage your personal information' },
  { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Configure email and push notifications' },
  { id: 'security', name: 'Security', icon: Lock, description: 'Password and two-factor authentication' },
  { id: 'billing', name: 'Billing', icon: CreditCard, description: 'Payment methods and invoices' },
  { id: 'language', name: 'Language & Region', icon: Globe, description: 'Language, timezone, and date format' },
  { id: 'appearance', name: 'Appearance', icon: Palette, description: 'Theme and display preferences' },
  { id: 'privacy', name: 'Privacy', icon: Shield, description: 'Data sharing and visibility settings' },
];

export default function SettingsForm({ profile, preferences, userEmail }: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileData, setProfileData] = useState({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          full_name: `${profileData.firstName} ${profileData.lastName}`,
          phone: profileData.phone,
          bio: profileData.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="grid md:grid-cols-4 gap-6">
      <div className="md:col-span-1">
        <nav className="bg-white rounded-xl border p-2">
          {settingsSections.map(section => (
            <button key={section.id} onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                activeSection === section.id ? 'bg-orange-50 text-orange-600' : 'hover:bg-gray-50'
              }`}>
              <section.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{section.name}</span>
            </button>
          ))}
          <hr className="my-2" />
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </nav>
      </div>

      <div className="md:col-span-3">
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl border p-6">
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Profile Settings</h2>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-orange-600" />
                </div>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Change Photo</button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" value={profileData.firstName}
                    onChange={e => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" value={profileData.lastName}
                    onChange={e => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={userEmail} disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={profileData.phone}
                    onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea rows={3} value={profileData.bio}
                    onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="Tell us about yourself..." />
                </div>
              </div>
              <button onClick={handleSaveProfile} disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
              {['Email notifications', 'Push notifications', 'Course updates', 'Marketing emails', 'Weekly digest'].map(item => (
                <label key={item} className="flex items-center justify-between py-3 border-b">
                  <span>{item}</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-orange-500" />
                </label>
              ))}
              <button className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Security Settings</h2>
              <div>
                <h3 className="font-medium mb-2">Change Password</h3>
                <div className="space-y-3 max-w-md">
                  <input type="password" placeholder="Current password" className="w-full px-3 py-2 border rounded-lg" />
                  <input type="password" placeholder="New password" className="w-full px-3 py-2 border rounded-lg" />
                  <input type="password" placeholder="Confirm new password" className="w-full px-3 py-2 border rounded-lg" />
                  <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                    Update Password
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600 mb-3">Add an extra layer of security to your account</p>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Enable 2FA</button>
              </div>
            </div>
          )}

          {activeSection === 'billing' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Billing & Payments</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium">Current Plan: <span className="text-orange-600">{profile?.role === 'student' ? 'Student' : 'Pro'}</span></p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Payment Method</h3>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                  <span>No payment method on file</span>
                </div>
                <button className="mt-3 px-4 py-2 border rounded-lg hover:bg-gray-50">Add Payment Method</button>
              </div>
            </div>
          )}

          {(activeSection === 'language' || activeSection === 'appearance' || activeSection === 'privacy') && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{settingsSections.find(s => s.id === activeSection)?.name}</h2>
              <p className="text-gray-600">{settingsSections.find(s => s.id === activeSection)?.description}</p>
              
              {activeSection === 'language' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select className="w-full max-w-xs px-3 py-2 border rounded-lg">
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <select className="w-full max-w-xs px-3 py-2 border rounded-lg">
                      <option>Eastern Time (ET)</option>
                      <option>Central Time (CT)</option>
                      <option>Pacific Time (PT)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <div className="flex gap-4">
                      {['Light', 'Dark', 'System'].map(theme => (
                        <label key={theme} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="theme" defaultChecked={theme === 'Light'} className="w-4 h-4 text-orange-500" />
                          <span>{theme}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'privacy' && (
                <div className="space-y-4">
                  {['Profile visibility', 'Show activity status', 'Allow analytics'].map(item => (
                    <label key={item} className="flex items-center justify-between py-3 border-b">
                      <span>{item}</span>
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-orange-500" />
                    </label>
                  ))}
                </div>
              )}

              <button className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                <Save className="w-4 h-4" /> Save Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
