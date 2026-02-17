import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreditCard, Shield, Smartphone, DollarSign, Circle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Elevate Card | Elevate For Humanity',
  description: 'Get your Elevate prepaid card for receiving refunds and stipends.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/card',
  },
};

export const dynamic = 'force-dynamic';

export default async function CardPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/card');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Elevate Card' }]} />
        </div>
      </div>

      <section className="bg-brand-green-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Elevate Card</h1>
          <p className="text-xl text-brand-green-100 mb-8">Receive your refunds and stipends faster with the Elevate prepaid card</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: DollarSign, title: 'Fast Deposits', desc: 'Get your money up to 2 days faster than traditional banks' },
              { icon: Shield, title: 'Secure', desc: 'Protected by bank-level security and fraud monitoring' },
              { icon: Smartphone, title: 'Mobile App', desc: 'Check your balance and transactions anytime' },
              { icon: Circle, title: 'No Fees', desc: 'No monthly fees or minimum balance requirements' },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border flex items-start gap-4">
                <feature.icon className="w-8 h-8 text-brand-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Get Your Card</h2>
          <p className="text-gray-600 mb-8">Contact your program coordinator to request an Elevate Card.</p>
          <a href="/contact" className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-green-700">
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
}
