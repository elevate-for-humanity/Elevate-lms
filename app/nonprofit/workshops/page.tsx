import Link from 'next/link';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Workshops | Selfish Inc.',
  description: 'Interactive workshops on mindfulness, healing, and personal growth.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/nonprofit/workshops',
  },
};

export const dynamic = 'force-dynamic';

export default async function WorkshopsPage() {
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

  // Get upcoming workshops
  const { data: upcomingWorkshops } = await supabase
    .from('workshops')
    .select('*')
    .eq('is_active', true)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  // Get past workshops for reference
  const { data: pastWorkshops } = await supabase
    .from('workshops')
    .select('*')
    .eq('is_active', true)
    .lt('date', new Date().toISOString())
    .order('date', { ascending: false })
    .limit(6);

  // Get workshop categories
  const { data: categories } = await supabase
    .from('workshop_categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  const defaultWorkshops = [
    {
      id: 1,
      title: 'Mindfulness Meditation Basics',
      description: 'Learn foundational meditation techniques for stress relief and mental clarity.',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: '2 hours',
      location: 'Virtual',
      capacity: 20,
      price: 0,
    },
    {
      id: 2,
      title: 'Healing Through Art',
      description: 'Express and process emotions through creative art therapy techniques.',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      duration: '3 hours',
      location: 'Indianapolis',
      capacity: 15,
      price: 25,
    },
    {
      id: 3,
      title: 'Building Resilience',
      description: 'Develop mental and emotional resilience for life\'s challenges.',
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      duration: '2 hours',
      location: 'Virtual',
      capacity: 25,
      price: 0,
    },
  ];

  const displayWorkshops = upcomingWorkshops && upcomingWorkshops.length > 0 
    ? upcomingWorkshops 
    : defaultWorkshops;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Nonprofit', href: '/nonprofit' }, { label: 'Workshops' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Workshops</h1>
          <p className="text-xl text-blue-100">
            Interactive sessions for mindfulness, healing, and personal growth
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link href="/nonprofit" className="text-blue-600 hover:text-blue-700 mb-8 inline-block">
          ← Back to Selfish Inc.
        </Link>

        {/* Upcoming Workshops */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Upcoming Workshops</h2>
          
          {displayWorkshops.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayWorkshops.map((workshop: any) => (
                <div key={workshop.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition">
                  <div className="bg-blue-100 p-4">
                    <div className="text-blue-600 font-bold text-lg">
                      {new Date(workshop.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-blue-500 text-sm">
                      {new Date(workshop.date).toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2">{workshop.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{workshop.description}</p>
                    
                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{workshop.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{workshop.location}</span>
                      </div>
                      {workshop.capacity && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{workshop.capacity} spots</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-600">
                        {workshop.price === 0 ? 'Free' : `$${workshop.price}`}
                      </span>
                      <Link
                        href={`/nonprofit/workshops/${workshop.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline"
                      >
                        Register <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming workshops scheduled.</p>
              <p className="text-gray-500 text-sm mt-2">
                Sign up for our newsletter to be notified of new workshops.
              </p>
            </div>
          )}
        </section>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Workshop Categories</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category: any) => (
                <span 
                  key={category.id}
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Past Workshops */}
        {pastWorkshops && pastWorkshops.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Past Workshops</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {pastWorkshops.map((workshop: any) => (
                <div key={workshop.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">
                    {new Date(workshop.date).toLocaleDateString()}
                  </div>
                  <h3 className="font-semibold">{workshop.title}</h3>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Want to Host a Workshop?</h3>
          <p className="text-gray-600 mb-6">
            We offer custom workshops for organizations and groups.
          </p>
          <Link 
            href="/contact" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Contact Us
          </Link>
        </section>
      </div>
    </div>
  );
}
