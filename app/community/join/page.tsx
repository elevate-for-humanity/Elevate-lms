export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Users, MessageSquare, BookOpen, Award, ArrowRight, Star } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Join Our Community | Elevate for Humanity',
  description: 'Become part of the Elevate community. Connect with fellow learners, access exclusive resources, and accelerate your career growth.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community/join',
  },
};

export default async function JoinCommunityPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Fetch testimonials from database
  const { data: testimonials } = await db
    .from('testimonials')
    .select('name, role, quote, image_url')
    .eq('approved', true)
    .order('display_order')
    .limit(4);

  const benefits = [
    { icon: Users, title: 'Connect with Peers', description: 'Network with students and professionals in your field' },
    { icon: MessageSquare, title: 'Discussion Forums', description: 'Ask questions, share knowledge, and get support' },
    { icon: BookOpen, title: 'Exclusive Resources', description: 'Access study guides, templates, and career tools' },
    { icon: Award, title: 'Recognition', description: 'Earn badges and recognition for your contributions' },
  ];

  return (
    <div className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Join' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative py-20 bg-brand-blue-800 text-white overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Join the Elevate Community</h1>
          <p className="text-xl text-brand-blue-100 mb-8 max-w-2xl mx-auto">
            Connect with fellow learners, access exclusive resources, and accelerate your career growth.
          </p>
          <Link href="/apply" className="inline-flex items-center gap-2 bg-white text-brand-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-50 transition">
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Community Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-brand-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Community Says</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial: any, idx: number) => (
                <div key={idx} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-blue-600 font-semibold">
                        {testimonial.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Start your journey with Elevate for Humanity today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="bg-brand-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-700 transition">
              Apply Now
            </Link>
            <Link href="/programs" className="border border-slate-300 px-8 py-4 rounded-lg font-semibold hover:bg-slate-50 transition">
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
