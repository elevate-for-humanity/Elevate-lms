import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Heart, Users, TrendingUp, MessageSquare, Calendar, ArrowRight, CheckCircle, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Ongoing Support | Career Services | Elevate For Humanity',
  description: 'Career support doesn\'t end at graduation. Access continued mentorship, job assistance, and professional development resources.',
};

export const dynamic = 'force-dynamic';

export default async function OngoingSupportPage() {
  const supabase = await createClient();
  if (!supabase) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1><p className="text-gray-600">Please try again later.</p></div></div>;
  }
  const { data: { user } } = await supabase.auth.getUser();

  // Get alumni count
  const { count: alumniCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'alumni');

  // Get user's support history if logged in
  let supportHistory = null;
  if (user) {
    const { data } = await supabase
      .from('support_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    supportHistory = data;
  }

  // Get upcoming alumni events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('event_type', 'alumni')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(3);

  const services = [
    {
      icon: TrendingUp,
      title: 'Career Advancement',
      description: 'Get help with promotions, raises, and career transitions even after you\'re employed.',
      features: ['Salary negotiation coaching', 'Promotion strategies', 'Career path planning'],
    },
    {
      icon: Users,
      title: 'Alumni Network',
      description: 'Stay connected with fellow graduates for networking and mutual support.',
      features: ['Alumni directory access', 'Networking events', 'Mentorship opportunities'],
    },
    {
      icon: MessageSquare,
      title: 'Continued Counseling',
      description: 'Access career counselors whenever you need guidance or support.',
      features: ['Unlimited consultations', 'Job search assistance', 'Professional development'],
    },
    {
      icon: Heart,
      title: 'Personal Support',
      description: 'Life happens. We\'re here to help with challenges that affect your career.',
      features: ['Resource referrals', 'Emergency assistance', 'Work-life balance support'],
    },
  ];

  const benefits = [
    'Lifetime access to career services',
    'Free resume updates and reviews',
    'Job search assistance if you need to change jobs',
    'Access to new training and certifications',
    'Invitations to alumni events and networking',
    'Mentorship program participation',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services', href: '/career-services' }, { label: 'Ongoing Support' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[400px] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/heroes-hq/success-hero.jpg)' }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 text-white">
          <Link href="/career-services" className="text-pink-200 hover:text-white mb-4 inline-block">
            ← Career Services
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Ongoing Support</h1>
          <p className="text-xl text-pink-100 max-w-2xl">
            Your success is our success. Career support doesn't end at graduation—we're here for the long haul.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-pink-600">{alumniCount || 500}+</div>
              <div className="text-gray-600">Alumni Supported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-600">Lifetime</div>
              <div className="text-gray-600">Access to Services</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-600">Free</div>
              <div className="text-gray-600">For All Graduates</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Services */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Support Services</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {services.map((service) => (
                  <div key={service.title} className="bg-white rounded-xl shadow-sm border p-6">
                    <service.icon className="w-10 h-10 text-pink-600 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-gray-500">
                          <CheckCircle className="w-4 h-4 text-pink-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Alumni Benefits</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Support History */}
            {user && supportHistory && supportHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Your Support History</h2>
                <div className="space-y-3">
                  {supportHistory.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{session.type}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {session.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact CTA */}
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-6">
              <h3 className="font-semibold mb-3">Need Support?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Our career services team is here to help you succeed.
              </p>
              <Link
                href="/career-services/contact"
                className="block w-full text-center bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 mb-3"
              >
                Contact Career Services
              </Link>
              <a
                href="/support"
                className="flex items-center justify-center gap-2 text-pink-600 font-medium"
              >
                <Phone className="w-4 h-4" /> Get Help Online
              </a>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold mb-4">Alumni Events</h3>
              {events && events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event: any) => (
                    <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-pink-600 text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.start_date).toLocaleDateString()}
                      </div>
                      <p className="font-medium text-sm">{event.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No upcoming events</p>
              )}
              <Link
                href="/events"
                className="block text-center text-pink-600 text-sm font-medium mt-4 hover:underline"
              >
                View All Events
              </Link>
            </div>

            {/* Related Services */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold mb-3">Related Services</h3>
              <div className="space-y-2 text-sm">
                <Link href="/career-services/job-placement" className="block text-pink-600 hover:underline">
                  Job Placement
                </Link>
                <Link href="/career-services/career-counseling" className="block text-pink-600 hover:underline">
                  Career Counseling
                </Link>
                <Link href="/alumni" className="block text-pink-600 hover:underline">
                  Alumni Network
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
