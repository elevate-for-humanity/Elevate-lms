import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { 
  ArrowRight, 
  
  Briefcase, 
  GraduationCap,
  Heart,
  Clock,
  DollarSign,
  Building2,
  Phone,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Find Your Pathway | Start Your Career Training Journey',
  description: 'Call Get Help Online or apply online for a new career. Explore training programs, check eligibility for funding, and connect with employers in Indiana.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/start',
  },
};

export const dynamic = 'force-dynamic';

const DEFAULT_PATHWAYS = [
  {
    title: 'I Want to Train for a New Career',
    description: 'Explore programs in healthcare, skilled trades, technology, and more.',
    icon: GraduationCap,
    href: '/programs',
    color: 'blue',
  },
  {
    title: 'I Want to Earn While I Learn',
    description: 'Find apprenticeships and employer-based training opportunities.',
    icon: DollarSign,
    href: '/programs/apprenticeships',
    color: 'green',
  },
  {
    title: 'I Need Help with Funding',
    description: 'Check if you qualify for WIOA, WRG, or other funding assistance. Indiana residents only.',
    icon: Briefcase,
    href: '/funding',
    color: 'blue',
  },
  {
    title: 'I Have a Background (Second Chance)',
    description: 'Many programs welcome justice-involved individuals.',
    icon: Heart,
    href: '/jri',
    color: 'amber',
  },
];

export default async function StartPage() {
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

  // Get pathways from database
  const { data: pathways } = await db
    .from('pathways')
    .select('*')
    .eq('is_active', true)
    .order('order', { ascending: true });

  // Get featured programs
  const { data: featuredPrograms } = await db
    .from('programs')
    .select('id, name, slug, description, duration')
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(4);

  // Get quick stats
  const { data: stats } = await db
    .from('statistics')
    .select('*')
    .eq('category', 'homepage')
    .order('order', { ascending: true })
    .limit(4);

  const displayPathways = pathways && pathways.length > 0 ? pathways : DEFAULT_PATHWAYS;

  const defaultStats = [
    { label: 'Programs Available', value: '20+' },
    { label: 'WIOA Approved', value: 'Yes' },
    { label: 'ETPL Listed', value: 'Yes' },
    { label: 'Job Placement', value: 'Included' },
  ];

  const displayStats = stats && stats.length > 0 ? stats : defaultStats;

  const colorClasses: Record<string, string> = {
    blue: 'bg-brand-blue-50 border-brand-blue-200 hover:border-brand-blue-400',
    green: 'bg-brand-green-50 border-brand-green-200 hover:border-brand-green-400',
    blue: 'bg-brand-blue-50 border-brand-blue-200 hover:border-brand-blue-400',
    amber: 'bg-amber-50 border-amber-200 hover:border-amber-400',
  };

  const iconColorClasses: Record<string, string> = {
    blue: 'text-brand-blue-600',
    green: 'text-brand-green-600',
    blue: 'text-brand-blue-600',
    amber: 'text-amber-600',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Start' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-slate-700 text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-4">
            Find Your Pathway
          </h1>
          <p className="text-xl md:text-2xl text-brand-blue-100 mb-8">
            Call Get Help Online or apply online for a new career. We'll help you find the right program and funding.
          </p>
        </div>
      </section>

      {/* Pathway Cards */}
      <section className="py-12 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black text-center mb-10">
            What brings you here today?
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {displayPathways.map((pathway: any, index: number) => {
              const Icon = pathway.icon || GraduationCap;
              const color = pathway.color || 'blue';
              return (
                <Link
                  key={index}
                  href={pathway.href || '/programs'}
                  className={`block p-6 rounded-xl border-2 transition-all ${colorClasses[color] || colorClasses.blue}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-white ${iconColorClasses[color] || iconColorClasses.blue}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {pathway.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{pathway.description}</p>
                      <span className={`inline-flex items-center gap-1 font-medium ${iconColorClasses[color] || iconColorClasses.blue}`}>
                        Explore <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {displayStats.map((stat: any, index: number) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-brand-blue-600 mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      {featuredPrograms && featuredPrograms.length > 0 && (
        <section className="py-12 md:py-16 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Popular Programs</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPrograms.map((program: any) => (
                <Link
                  key={program.id}
                  href={`/programs/${program.slug || program.id}`}
                  className="bg-white rounded-xl p-6 border hover:shadow-md transition group"
                >
                  <h3 className="font-bold text-lg mb-2 group-hover:text-brand-blue-600 transition">
                    {program.name}
                  </h3>
                  {program.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {program.description}
                    </p>
                  )}
                  {program.duration && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {program.duration}
                    </div>
                  )}
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:underline"
              >
                View All Programs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-brand-blue-600 font-bold text-xl">1</span>
              </div>
              <h3 className="font-bold mb-2">Apply</h3>
              <p className="text-gray-600 text-sm">
                Complete a simple application and we'll check your eligibility for workforce funding. Indiana residents only — eligibility is not guaranteed.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-brand-blue-600 font-bold text-xl">2</span>
              </div>
              <h3 className="font-bold mb-2">Train</h3>
              <p className="text-gray-600 text-sm">
                Enroll in your chosen program and earn industry-recognized certifications.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-brand-blue-600 font-bold text-xl">3</span>
              </div>
              <h3 className="font-bold mb-2">Work</h3>
              <p className="text-gray-600 text-sm">
                Connect with employers and start your new career.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-brand-blue-100 mb-8">
            Apply today and take the first step toward your new career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-700 transition"
            >
              <Phone className="w-5 h-5" />
              Get Help Online
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
