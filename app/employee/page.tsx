import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { User, FileText, Calendar, DollarSign, Clock, Settings } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Employee Portal | Elevate For Humanity',
  description: 'Employee self-service portal for HR, payroll, and benefits.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/employee',
  },
};

export const dynamic = 'force-dynamic';

export default async function EmployeePortalPage() {
  const supabase = await createClient();
  
  if (!supabase) {
    redirect('/login?redirect=/employee');
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/employee');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const links = [
    { href: '/employee/profile', icon: User, label: 'My Profile', desc: 'View and update your information' },
    { href: '/employee/documents', icon: FileText, label: 'Documents', desc: 'Access pay stubs and tax forms' },
    { href: '/employee/time-off', icon: Calendar, label: 'Time Off', desc: 'Request and track PTO' },
    { href: '/employee/payroll', icon: DollarSign, label: 'Payroll', desc: 'View pay history and direct deposit' },
    { href: '/employee/schedule', icon: Clock, label: 'Schedule', desc: 'View your work schedule' },
    { href: '/employee/settings', icon: Settings, label: 'Settings', desc: 'Account preferences' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Employee Portal' },
        ]}
      />
      <div className="bg-brand-blue-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Employee Portal</h1>
          <p className="text-indigo-100">Welcome, {profile?.full_name || 'Employee'}</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <link.icon className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-gray-900">{link.label}</h3>
              <p className="text-sm text-gray-600">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
