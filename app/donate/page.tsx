import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import DonationForm from '@/components/DonationForm';
import {
  Heart,
  Users,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Shield,
  Award,
  Phone,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Donate | Support Career Training | Elevate for Humanity',
  description: 'Support free career training for underserved communities. Your donation helps provide job skills, certifications, and employment opportunities.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/donate',
  },
};

export const dynamic = 'force-dynamic';

export default async function DonatePage() {
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

  // Get impact stats from database
  const { count: studentsHelped } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true });

  const { count: graduatesPlaced } = await db
    .from('placements')
    .select('*', { count: 'exact', head: true });

  const { count: totalDonors } = await db
    .from('donations')
    .select('user_id', { count: 'exact', head: true });

  // Get total donations amount
  const { data: donationTotal } = await db
    .from('donations')
    .select('amount')
    .eq('status', 'completed');

  const totalRaised = donationTotal?.reduce((sum: number, d: any) => sum + (d.amount || 0), 0) || 0;

  // Get recent donors (anonymized)
  const { data: recentDonations } = await db
    .from('donations')
    .select('amount, created_at, is_anonymous')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);

  const impactStats = [
    { icon: Users, value: studentsHelped || 500, label: 'Students Served' },
    { icon: GraduationCap, value: '20+', label: 'Training Programs' },
    { icon: Briefcase, value: '50+', label: 'Employer Partners' },
    { icon: Heart, value: totalDonors || 100, label: 'Donors' },
  ];

  const donationImpact = [
    { amount: 50, impact: 'Provides course materials for one student' },
    { amount: 100, impact: 'Covers certification exam fees' },
    { amount: 250, impact: 'Funds one week of training' },
    { amount: 500, impact: 'Sponsors a full certification program' },
    { amount: 1000, impact: 'Provides complete career training for one student' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Donate' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-teal-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-semibold">501(c)(3) Tax-Deductible</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Transform Lives Through Career Training
          </h1>
          <p className="text-xl text-teal-100 max-w-3xl mx-auto mb-8">
            Your donation provides Career training at no cost to eligible participants, certifications, and job placement 
            for individuals facing barriers to employment.
          </p>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {impactStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <div className="text-3xl font-bold">
                  {typeof stat.value === 'number' ? `${stat.value}+` : stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Donation Form */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Make a Donation</h2>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <DonationForm />
            </div>
          </div>

          {/* Impact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-6">Your Impact</h2>
              <div className="space-y-4">
                {donationImpact.map((item) => (
                  <div key={item.amount} className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                    <div className="w-20 text-center">
                      <span className="text-2xl font-bold text-teal-600">${item.amount}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700">{item.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Donations */}
            {recentDonations && recentDonations.length > 0 && (
              <div className="bg-teal-50 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Recent Donations</h3>
                <div className="space-y-3">
                  {recentDonations.map((donation: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {donation.is_anonymous ? 'Anonymous' : 'A generous donor'}
                      </span>
                      <span className="font-medium text-teal-600">${donation.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Why Donate */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Why Donate?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <p className="text-gray-600">100% of donations fund training programs</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <p className="text-gray-600">Tax-deductible 501(c)(3) organization</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <p className="text-gray-600">Direct impact on underserved communities</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <p className="text-gray-600">Transparent reporting on fund usage</p>
                </div>
              </div>
            </div>

            {/* Total Raised */}
            {totalRaised > 0 && (
              <div className="bg-teal-500 text-white rounded-xl p-6 text-center">
                <TrendingUp className="w-10 h-10 mx-auto mb-3" />
                <p className="text-teal-100 mb-1">Total Raised</p>
                <p className="text-4xl font-bold">${totalRaised.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Other Ways to Give */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Other Ways to Give</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center">
              <Award className="w-10 h-10 text-teal-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Corporate Sponsorship</h3>
              <p className="text-gray-600 text-sm mb-4">
                Partner with us to sponsor training programs and hire graduates.
              </p>
              <Link href="/partner" className="text-teal-600 font-medium hover:underline">
                Learn More
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <Users className="w-10 h-10 text-teal-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Volunteer</h3>
              <p className="text-gray-600 text-sm mb-4">
                Share your expertise as a mentor, instructor, or career coach.
              </p>
              <Link href="/volunteer" className="text-teal-600 font-medium hover:underline">
                Get Involved
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <Heart className="w-10 h-10 text-teal-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Monthly Giving</h3>
              <p className="text-gray-600 text-sm mb-4">
                Become a sustaining donor with a recurring monthly gift.
              </p>
              <Link href="/donate/monthly" className="text-teal-600 font-medium hover:underline">
                Start Monthly
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* FAQ */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Donation FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'Is my donation tax-deductible?', a: 'Yes. Elevate for Humanity is a 501(c)(3) nonprofit organization. Your donation is tax-deductible to the extent allowed by law.' },
              { q: 'How is my donation used?', a: 'Donations support student scholarships, training materials, supportive services (transportation, childcare), and program expansion.' },
              { q: 'Can I donate to a specific program?', a: 'Yes. You can designate your gift to a specific program or let us allocate it where needed most. Contact us to discuss designated giving.' },
              { q: 'Do you accept corporate donations?', a: 'Yes. We welcome corporate partnerships and sponsorships. Contact us to discuss corporate giving opportunities.' },
              { q: 'Can I set up recurring donations?', a: 'Yes. Monthly giving provides sustained support for our programs. You can set up recurring donations through our online form.' },
              { q: 'Will I receive a receipt?', a: 'Yes. You will receive an email receipt immediately after donating. Annual giving statements are provided for tax purposes.' },
            ].map((faq, i) => (
              <details key={i} className="bg-white rounded-xl overflow-hidden shadow-sm group">
                <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-slate-600">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/inquiry"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              Ask a Question
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
