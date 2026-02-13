import Link from 'next/link';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Heart, Users, Calendar, CheckCircle, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Divorce Counseling | Selfish Inc.',
  description: 'Supportive guidance through the challenges of divorce and separation.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/nonprofit/divorce-counseling',
  },
};

export const dynamic = 'force-dynamic';

export default async function DivorceCounselingPage() {
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

  // Get divorce counseling services
  const { data: services } = await supabase
    .from('nonprofit_services')
    .select('*')
    .eq('category', 'divorce-counseling')
    .eq('is_active', true)
    .order('order', { ascending: true });

  // Get support groups
  const { data: supportGroups } = await supabase
    .from('support_groups')
    .select('*')
    .eq('category', 'divorce')
    .eq('is_active', true);

  // Get testimonials
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('category', 'divorce-counseling')
    .eq('is_featured', true)
    .limit(2);

  const defaultServices = [
    { title: 'Individual Counseling', description: 'One-on-one support to process emotions and develop coping strategies' },
    { title: 'Co-Parenting Support', description: 'Guidance for navigating parenting after separation' },
    { title: 'Support Groups', description: 'Connect with others going through similar experiences' },
    { title: 'Financial Planning', description: 'Resources for managing finances during transition' },
    { title: 'Children\'s Programs', description: 'Age-appropriate support for children of divorce' },
    { title: 'Mediation Services', description: 'Facilitated communication for amicable resolution' },
  ];

  const displayServices = services && services.length > 0 ? services : defaultServices;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Nonprofit', href: '/nonprofit' }, { label: 'Divorce Counseling' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-rose-500 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heart className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Divorce Counseling</h1>
          <p className="text-xl text-rose-100">
            Supportive guidance through life's transitions
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/nonprofit" className="text-blue-600 hover:text-blue-700 mb-8 inline-block">
          ← Back to Selfish Inc.
        </Link>

        {/* Introduction */}
        <section className="mb-12">
          <p className="text-lg text-gray-600">
            Divorce is one of life's most challenging transitions. Our compassionate 
            counselors provide a safe space to process emotions, develop healthy coping 
            strategies, and build a foundation for your next chapter.
          </p>
        </section>

        {/* Services */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {displayServices.map((service: any, index: number) => (
              <div key={index} className="bg-rose-50 rounded-xl p-6">
                <CheckCircle className="w-6 h-6 text-rose-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Support Groups */}
        {supportGroups && supportGroups.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Support Groups</h2>
            <div className="space-y-4">
              {supportGroups.map((group: any) => (
                <div key={group.id} className="bg-white border rounded-xl p-6">
                  <div className="flex items-center gap-2 text-rose-600 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">{group.schedule}</span>
                  </div>
                  <h3 className="font-bold text-lg">{group.title}</h3>
                  <p className="text-gray-600 mt-1">{group.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Stories of Healing</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {testimonials.map((testimonial: any) => (
                <div key={testimonial.id} className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-600 italic mb-4">"{testimonial.content}"</p>
                  <div className="font-semibold">{testimonial.name}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
          <Heart className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">You Don't Have to Go Through This Alone</h3>
          <p className="text-gray-600 mb-6">
            Reach out today to schedule a confidential consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact" 
              className="bg-rose-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-rose-700 transition"
            >
              Schedule Consultation
            </Link>
            <a 
              href="/support"
              className="inline-flex items-center justify-center gap-2 border border-rose-600 text-rose-600 px-6 py-3 rounded-lg font-semibold hover:bg-rose-50 transition"
            >
              <Phone className="w-5 h-5" />
              Contact Us
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
