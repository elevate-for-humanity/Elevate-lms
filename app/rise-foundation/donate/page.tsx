import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Heart, Target, Users, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://elevateforhumanity.org/rise-foundation/donate',
  },
  title: 'Donate | Rise Foundation',
  description: 'Support our mission to elevate individuals and communities.',
};

export default async function DonatePage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-zinc-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Heart className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Make a Difference Today</h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto">
            Your donation helps us provide education, workforce development, and
            support services to those who need it most.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center">
            <Users className="h-12 w-12 text-purple-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-slate-900 mb-1">5,000+</p>
            <p className="text-slate-600">Lives Impacted</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center">
            <Target className="h-12 w-12 text-purple-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-slate-900 mb-1">20+</p>
            <p className="text-slate-600">Programs Offered</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center">
            <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-slate-900 mb-1">85%</p>
            <p className="text-slate-600">Success Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Active Campaigns
            </h2>

            {!campaigns || campaigns.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                <Heart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  General Fund
                </h3>
                <p className="text-slate-600 mb-6">
                  Support our mission with a general donation
                </p>
                <button className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
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
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {campaign.name}
                      </h3>
                      {campaign.description && (
                        <p className="text-slate-600 mb-4">
                          {campaign.description}
                        </p>
                      )}

                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-slate-600 mb-2">
                          <span>
                            ${campaign.current_amount.toLocaleString()} raised
                          </span>
                          <span>
                            Goal: ${campaign.goal_amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      <button className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
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
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Quick Donate
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[25, 50, 100, 250].map((amount) => (
                  <button
                    key={amount}
                    className="px-4 py-3 border-2 border-slate-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-colors font-medium"
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
              <button className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                Continue to Payment
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-bold text-purple-900 mb-2">Tax Deductible</h3>
              <p className="text-purple-800 text-sm">
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
