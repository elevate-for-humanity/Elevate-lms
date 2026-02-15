import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Settings, User, Bell, Building } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Settings | Employer Portal',
  description: 'Manage your employer account settings and preferences.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function EmployerSettingsPage() {
  const supabase = await createClient();
  
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/employer-portal/settings');

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, job_title')
    .eq('id', user.id)
    .single();

  // Fetch employer/company info
  const { data: employer } = await supabase
    .from('employers')
    .select('company_name, industry, company_size, ein')
    .eq('user_id', user.id)
    .single();

  const settingsSections = [
    {
      id: 'profile',
      name: 'Profile Settings',
      icon: User,
      description: 'Update your personal information and contact details',
      fields: [
        { label: 'Full Name', value: profile?.full_name || '', type: 'text', name: 'full_name' },
        { label: 'Email', value: profile?.email || user.email || '', type: 'email', name: 'email' },
        { label: 'Phone', value: profile?.phone || '', type: 'tel', name: 'phone' },
        { label: 'Job Title', value: profile?.job_title || '', type: 'text', name: 'job_title' },
      ],
    },
    {
      id: 'company',
      name: 'Company Information',
      icon: Building,
      description: 'Manage your company profile and business details',
      fields: [
        { label: 'Company Name', value: employer?.company_name || '', type: 'text', name: 'company_name' },
        { label: 'Industry', value: employer?.industry || '', type: 'text', name: 'industry' },
        { label: 'Company Size', value: employer?.company_size || '', type: 'text', name: 'company_size' },
        { label: 'EIN', value: employer?.ein ? `**-***${employer.ein.slice(-4)}` : '', type: 'text', name: 'ein' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Settings" }]} />
<div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {settingsSections.map((section) => (
            <div key={section.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{section.name}</h2>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {section.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      defaultValue={field.value}
                      name={field.name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-500">Configure how you receive alerts</p>
              </div>
            </div>
            <div className="space-y-3">
              {['New candidate applications', 'WOTC status updates', 'Program announcements'].map((item) => (
                <label key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-gray-700">{item}</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-green-600 rounded" />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
