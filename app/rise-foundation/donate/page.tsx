import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Heart, Target, Users, TrendingUp } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/rise-foundation/donate',
  },
  title: 'Donate | Rise Foundation',
  description: 'Support our mission to elevate individuals and communities.',
};

export default async function DonatePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: campaigns } = await db
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Rise Foundation', href: '/rise-foundation' }, { label: 'Donate' }]} />
        </div>
      </div>

      <section className="bg-brand-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Heart className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Make a Difference Today</h1>
          <p className="text-xl text-brand-blue-100 max-w-2xl mx-auto">
            Your donation helps us provide education, workforce development, and
            support services to those who need it most.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center">
            <Users className="h-12 w-12 text-brand-blue-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-black mb-1">Community</p>
            <p className="text-black">Impact</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center">
            <Target className="h-12 w-12 text-brand-blue-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-black mb-1">20+</p>
            <p className="text-black">Programs Offered</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center">
            <TrendingUp className="h-12 w-12 text-brand-blue-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-black mb-1">Growing</p>
            <p className="text-black">Network</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-black mb-6">
              Active Campaigns
            </h2>

            {!campaigns || campaigns.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                <Heart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-black mb-2">
                  General Fund
                </h3>
                <p className="text-black mb-6">
                  Support our mission with a general donation
                </p>
                <button className="px-8 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors font-medium" aria-label="Action button">
                  Donate Now
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {campaigns.map((campaign) => {
                  const progress =
                    campaign.goal_amount > 0
                      ? (campaign.current_amount / campaign.goal_amount) * 100
                      : 0;

                  return (
                    <div
                      key={campaign.id}
                      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
                    >
                      <h3 className="text-xl font-bold text-black mb-2">
                        {campaign.name}
                      </h3>
                      {campaign.description && (
                        <p className="text-black mb-4">
                          {campaign.description}
                        </p>
                      )}

                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-black mb-2">
                          <span>
                            ${campaign.current_amount.toLocaleString()} raised
                          </span>
                          <span>
                            Goal: ${campaign.goal_amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className="bg-white h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      <button className="w-full px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors font-medium" aria-label="Action button">
                        Donate to This Campaign
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-4">
                Quick Donate
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[25, 50, 100, 250].map((amount) => (
                  <button
                    key={amount}
                    className="px-4 py-3 border-2 border-slate-300 rounded-lg hover:border-brand-blue-600 hover:bg-brand-blue-50 transition-colors font-medium"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Custom amount"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-4"
              />
              <button className="w-full px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors font-medium" aria-label="Action button">
                Continue to Payment
              </button>
            </div>

            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-brand-blue-900 mb-2">Tax Deductible</h3>
              <p className="text-brand-blue-800 text-sm">
                Rise Foundation is a 501(c)(3) nonprofit organization. Your
                donation is tax-deductible to the extent allowed by law.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
