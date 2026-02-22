import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Calendar, ArrowRight, Bell, Megaphone, GraduationCap, Building2, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Updates & Announcements | Elevate For Humanity',
  description: 'Latest news, program updates, and announcements from Elevate for Humanity',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/updates',
  },
};

const updates = [
  {
    date: 'January 2026',
    title: '2026 Program Calendar & Funding Pathways',
    description: 'Upcoming cohorts for healthcare, skilled trades, and technology training programs. New funding options available through workforce partnerships.',
    href: '/updates/2026/01/program-calendar',
    category: 'Programs',
    icon: Calendar,
  },
  {
    date: 'January 2026',
    title: 'New Employer Partnership Program',
    description: 'Introducing employer-sponsored training with post-hire reimbursement. Companies can now sponsor student tuition with flexible payment terms.',
    href: '/employers',
    category: 'Partnerships',
    icon: Building2,
  },
  {
    date: 'January 2026',
    title: 'Healthcare Training Expansion',
    description: 'New Medical Assistant and Phlebotomy cohorts starting February. WIOA funding available for eligible students.',
    href: '/programs/healthcare',
    category: 'Programs',
    icon: GraduationCap,
  },
  {
    date: 'December 2025',
    title: 'CDL Training Program Launch',
    description: 'Commercial Driver License training now available. Class A and Class B certifications with job placement assistance.',
    href: '/programs/cdl',
    category: 'Programs',
    icon: GraduationCap,
  },
  {
    date: 'December 2025',
    title: 'VITA Tax Preparation Services',
    description: 'Free tax preparation services available for students and community members. IRS-certified volunteers ready to help.',
    href: '/tax',
    category: 'Services',
    icon: Users,
  },
  {
    date: 'November 2025',
    title: 'Workforce Board Partnership Expansion',
    description: 'New partnerships with regional workforce boards to expand funding access for adult learners and dislocated workers.',
    href: '/funding',
    category: 'Funding',
    icon: Building2,
  },
];

export default async function UpdatesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch updates
  const { data: dbUpdates } = await db
    .from('updates')
    .select('*')
    .order('date', { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Updates" }]} />
      </div>
{/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-orange-100 rounded-xl flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-brand-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Updates & Announcements</h1>
              <p className="text-gray-600">
                Stay informed about programs, funding, and workforce development news
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Subscribe Banner */}
        <div className="bg-slate-700 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6" />
              <div>
                <p className="font-semibold">Get Updates Delivered</p>
                <p className="text-brand-orange-100 text-sm">Subscribe to receive program announcements and funding alerts</p>
              </div>
            </div>
            <Link
              href="/contact"
              className="px-6 py-2 bg-white text-brand-orange-600 rounded-lg font-semibold hover:bg-brand-orange-50 transition-colors"
            >
              Subscribe
            </Link>
          </div>
        </div>

        {/* Updates List */}
        <div className="space-y-4">
          {updates.map((update, index) => (
            <Link
              key={index}
              href={update.href}
              className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-brand-orange-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-orange-100 transition-colors">
                  <update.icon className="w-6 h-6 text-brand-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">{update.date}</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                      {update.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-brand-orange-600 transition-colors">
                    {update.title}
                  </h2>
                  <p className="text-gray-600 mt-2">{update.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-orange-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        {/* Archive Link */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 mb-4">Looking for older announcements?</p>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-brand-orange-600 font-semibold hover:text-brand-orange-700"
          >
            View News Archive
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
