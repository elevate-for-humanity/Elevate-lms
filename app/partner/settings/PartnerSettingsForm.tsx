'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Building2, Bell, Shield, Save } from 'lucide-react';

interface Props {
  profile: any;
  programHolder: any;
  delegate: any;
}

export default function PartnerSettingsForm({ profile, programHolder, delegate }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileData, setProfileData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  });

  const [orgData, setOrgData] = useState({
    name: programHolder?.name || delegate?.organization || '',
    contactName: programHolder?.contact_name || '',
    contactEmail: programHolder?.contact_email || '',
    contactPhone: programHolder?.contact_phone || '',
    address: programHolder?.address || '',
    city: programHolder?.city || '',
    state: programHolder?.state || '',
    zipCode: programHolder?.zip_code || '',
    website: programHolder?.website || '',
    territory: delegate?.territory || '',
  });

  const [notifications, setNotifications] = useState({
    emailEnrollments: true,
    emailCompletions: true,
    emailReports: true,
    emailMarketing: false,
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.fullName,
          phone: profileData.phone,
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

  const handleSaveOrganization = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      if (programHolder) {
        const { error } = await supabase
          .from('program_holders')
          .update({
            name: orgData.name,
            contact_name: orgData.contactName,
            contact_email: orgData.contactEmail,
            contact_phone: orgData.contactPhone,
            address: orgData.address,
            city: orgData.city,
            state: orgData.state,
            zip_code: orgData.zipCode,
            website: orgData.website,
            updated_at: new Date().toISOString(),
          })
          .eq('id', programHolder.id);

        if (error) throw error;
      } else if (delegate) {
        const { error } = await supabase
          .from('delegates')
          .update({
            organization: orgData.name,
            territory: orgData.territory,
            phone: orgData.contactPhone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', delegate.id);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Organization settings updated' });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'organization', name: 'Organization', icon: Building2 },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="md:col-span-1">
        <nav className="bg-white rounded-xl border p-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                activeTab === tab.id ? 'bg-brand-orange-50 text-brand-orange-600' : 'hover:bg-gray-50'
              }`}>
              <tab.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="md:col-span-3">
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-brand-green-50 text-brand-green-700 border border-brand-green-200' : 'bg-brand-red-50 text-brand-red-700 border border-brand-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl border p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Profile Settings</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={profileData.fullName} 
                    onChange={e => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={profileData.email} disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500" />
                  <p className="text-xs text-gray-500 mt-1">Contact support to change email</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={profileData.phone}
                    onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
                </div>
              </div>
              <button onClick={handleSaveProfile} disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600 disabled:opacity-50">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Organization Settings</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                  <input type="text" value={orgData.name}
                    onChange={e => setOrgData({ ...orgData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
                </div>
                {programHolder && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                      <input type="text" value={orgData.contactName}
                        onChange={e => setOrgData({ ...orgData, contactName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                      <input type="email" value={orgData.contactEmail}
                        onChange={e => setOrgData({ ...orgData, contactEmail: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                      <input type="tel" value={orgData.contactPhone}
                        onChange={e => setOrgData({ ...orgData, contactPhone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input type="url" value={orgData.website}
                        onChange={e => setOrgData({ ...orgData, website: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input type="text" value={orgData.address}
                        onChange={e => setOrgData({ ...orgData, address: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input type="text" value={orgData.city}
                        onChange={e => setOrgData({ ...orgData, city: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input type="text" value={orgData.state}
                        onChange={e => setOrgData({ ...orgData, state: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <input type="text" value={orgData.zipCode}
                        onChange={e => setOrgData({ ...orgData, zipCode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
                    </div>
                  </>
                )}
                {delegate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Territory</label>
                    <input type="text" value={orgData.territory}
                      onChange={e => setOrgData({ ...orgData, territory: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
                  </div>
                )}
              </div>
              <button onClick={handleSaveOrganization} disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600 disabled:opacity-50">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Organization'}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: 'emailEnrollments', label: 'New student enrollments', desc: 'Get notified when a student enrolls through your referral' },
                  { key: 'emailCompletions', label: 'Program completions', desc: 'Get notified when a referred student completes a program' },
                  { key: 'emailReports', label: 'Monthly reports', desc: 'Receive monthly performance summary reports' },
                  { key: 'emailMarketing', label: 'Marketing updates', desc: 'Receive news about new programs and features' },
                ].map(item => (
                  <label key={item.key} className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" 
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                      className="mt-1 w-5 h-5 rounded text-brand-orange-500" />
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button className="flex items-center gap-2 px-6 py-2 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600">
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Change Password</h3>
                  <div className="space-y-3">
                    <input type="password" placeholder="Current password" 
                      className="w-full px-3 py-2 border rounded-lg" />
                    <input type="password" placeholder="New password" 
                      className="w-full px-3 py-2 border rounded-lg" />
                    <input type="password" placeholder="Confirm new password" 
                      className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <button className="mt-3 px-4 py-2 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600">
                    Update Password
                  </button>
                </div>
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 mb-3">Add an extra layer of security to your account</p>
                  <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
