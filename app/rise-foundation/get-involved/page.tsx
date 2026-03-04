import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Heart, Users, Calendar, Phone, Mail, ArrowRight, HandHeart, Briefcase } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Get Involved | Rise Foundation',
  description: 'Join our mission to support healing and recovery. Volunteer, donate, or become a partner.',
};

export const dynamic = 'force-dynamic';

export default async function GetInvolvedPage() {
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

  const { count: volunteerCount } = await db
    .from('volunteers')
    .select('*', { count: 'exact', head: true })
    .eq('organization', 'rise-foundation');

  const { data: opportunities } = await db
    .from('volunteer_opportunities')
    .select('*')
    .eq('organization', 'rise-foundation')
    .eq('is_active', true)
    .limit(4);

  const ways = [
    {
      icon: HandHeart,
      title: 'Volunteer',
      description: 'Share your time and skills to support individuals on their healing journey.',
      href: '/rise-foundation/volunteer',
      color: 'pink',
      image: '/images/pages/philanthropy-hero.jpg',
    },
    {
      icon: Heart,
      title: 'Donate',
      description: 'Your financial support enables us to provide free services to those in need.',
      href: '/donate',
      color: 'blue',
      image: '/images/pages/philanthropy-hero.jpg',
    },
    {
      icon: Briefcase,
      title: 'Partner',
      description: 'Organizations can partner with us to expand our reach and impact.',
      href: '/rise-foundation/partner',
      color: 'blue',
      image: '/images/pages/philanthropy-hero.jpg',
    },
    {
      icon: Users,
      title: 'Refer Someone',
      description: 'Know someone who could benefit from our services? Help connect them.',
      href: '/rise-foundation/refer',
      color: 'green',
      image: '/images/pages/philanthropy-hero.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Rise Foundation', href: '/rise-foundation' }, { label: 'Get Involved' }]} />
        </div>
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[60vh] min-h-[400px] max-h-[720px] w-full overflow-hidden">
          <Image src="/images/pages/rise-foundation-page-1.jpg" alt="Hero image" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Get Involved</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Join our community of compassionate individuals making a difference in people's lives.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-brand-blue-600">{volunteerCount || 50}+</div>
              <div className="text-gray-600">Active Volunteers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-blue-600">Growing</div>
              <div className="text-gray-600">Community</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-blue-600">10+</div>
              <div className="text-gray-600">Partner Organizations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ways to Get Involved */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Ways to Get Involved</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {ways.map((way) => (
              <Link
                key={way.title}
                href={way.href}
                className="group bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition"
              >
                <div className="h-48 relative">
                  <img
                    src={way.image}
                    alt={way.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                    <way.icon className="w-6 h-6" />
                    <h3 className="text-xl font-bold">{way.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{way.description}</p>
                  <span className="inline-flex items-center gap-1 text-brand-blue-600 font-medium group-hover:underline">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer Opportunities */}
      {opportunities && opportunities.length > 0 && (
        <section className="py-16 bg-brand-blue-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Current Volunteer Opportunities</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {opportunities.map((opp: any) => (
                <div key={opp.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-lg mb-2">{opp.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{opp.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {opp.schedule}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="py-16 bg-slate-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Contact us to learn more about how you can get involved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100"
            >
              <Phone className="w-5 h-5" /> Contact Us
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-blue-400 border-2 border-white"
            >
              <Mail className="w-5 h-5" /> Email Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
