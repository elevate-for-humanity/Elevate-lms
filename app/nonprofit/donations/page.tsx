import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Heart, DollarSign, Users, TrendingUp, Gift, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Donate | Selfish Inc.',
  description: 'Support mental wellness and holistic healing services. Your donation helps provide counseling and workshops to those in need.',
};

export const dynamic = 'force-dynamic';

export default async function DonationsPage() {
  const supabase = await createClient();

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

  // Get donation tiers
  const { data: donationTiers } = await supabase
    .from('donation_tiers')
    .select('*')
    .eq('is_active', true)
    .order('amount', { ascending: true });

  // Get impact statistics
  const { data: impactStats } = await supabase
    .from('impact_statistics')
    .select('*')
    .eq('category', 'donations')
    .order('order', { ascending: true });

  // Get recent donors (anonymized)
  const { data: recentDonors } = await supabase
    .from('donations')
    .select('amount, created_at, is_anonymous, donor_name')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);

  const defaultTiers = [
    {
      amount: 50,
      title: 'Supporter',
      description: 'Provides one counseling session',
      icon: Heart,
    },
    {
      amount: 100,
      title: 'Advocate',
      description: 'Sponsors a workshop for 5 people',
      icon: Users,
    },
    {
      amount: 500,
      title: 'Champion',
      description: 'Funds a month of wellness programs',
      icon: TrendingUp,
    },
    {
      amount: 1000,
      title: 'Benefactor',
      description: 'Supports a full healing retreat',
      icon: Gift,
    },
  ];

  const displayTiers = donationTiers && donationTiers.length > 0 ? donationTiers : defaultTiers;

  const defaultStats = [
    { label: 'Programs', value: '20+' },
    { label: 'Services', value: 'Free' },
    { label: 'Support', value: 'Full' },
  ];

  const displayStats = impactStats && impactStats.length > 0 ? impactStats : defaultStats;

  return (
    <div className="min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Nonprofit', href: '/nonprofit' }, { label: 'Donations' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="py-20 px-4 bg-blue-50 text-center">
        <div className="max-w-4xl mx-auto">
          <Heart className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-black text-black mb-6">
            Support Our Mission
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your donation helps us provide mental wellness and holistic healing
            services to those in need
          </p>
          <Link
            href="https://donate.stripe.com/5kA5kn7EsfrD08w4gg"
            target="_blank"
            className="inline-block bg-blue-600 text-white px-12 py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Donate Now
          </Link>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8">
            {displayStats.map((stat: any, index: number) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Tiers */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-black mb-12">
            Your Impact
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {displayTiers.map((tier: any, index: number) => {
              const IconComponent = tier.icon || Heart;
              return (
                <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-2">${tier.amount}</h3>
                  <p className="text-blue-600 font-medium mb-2">{tier.title}</p>
                  <p className="text-gray-600 text-sm">{tier.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ways to Give */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Ways to Give</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-4">One-Time Donation</h3>
              <p className="text-gray-600 mb-6">
                Make a single contribution to support our programs and services.
              </p>
              <Link
                href="https://donate.stripe.com/5kA5kn7EsfrD08w4gg"
                target="_blank"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Donate Once
              </Link>
            </div>
            <div className="bg-blue-50 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-4">Monthly Giving</h3>
              <p className="text-gray-600 mb-6">
                Become a sustaining supporter with a recurring monthly donation.
              </p>
              <Link
                href="https://donate.stripe.com/5kA5kn7EsfrD08w4gg"
                target="_blank"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Give Monthly
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Donors */}
      {recentDonors && recentDonors.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Recent Supporters</h2>
            <div className="space-y-4">
              {recentDonors.map((donor: any, index: number) => (
                <div key={index} className="bg-white rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">
                      {donor.is_anonymous ? 'Anonymous' : donor.donor_name || 'Anonymous'}
                    </span>
                  </div>
                  <span className="text-blue-600 font-semibold">${donor.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tax Info */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4">Tax-Deductible Giving</h3>
            <p className="text-gray-600 mb-4">
              Selfish Inc. is a registered 501(c)(3) nonprofit organization. 
              Your donations are tax-deductible to the fullest extent allowed by law.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500" />
                You will receive a receipt for your records
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500" />
                100% of donations go to programs and services
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Every Gift Makes a Difference</h2>
          <p className="text-blue-100 mb-8">
            Join us in supporting mental wellness and holistic healing for all.
          </p>
          <Link
            href="https://donate.stripe.com/5kA5kn7EsfrD08w4gg"
            target="_blank"
            className="inline-block bg-white text-blue-600 px-12 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition"
          >
            Donate Now
          </Link>
        </div>
      </section>
    </div>
  );
}
