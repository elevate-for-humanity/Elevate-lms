export const dynamic = 'force-dynamic';

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight } from "lucide-react";

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Success Stories | Graduate Testimonials | Elevate for Humanity',
  description: 'Read inspiring stories from our graduates who transformed their careers through apprenticeship and workforce training programs in Indiana.',
  alternates: { canonical: `${SITE_URL}/success-stories` },
  openGraph: {
    title: 'Success Stories | Elevate for Humanity',
    description: 'Read inspiring stories from our graduates who transformed their careers through apprenticeship training.',
    url: `${SITE_URL}/success-stories`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/images/success-new/success-1.jpg`, width: 1200, height: 630, alt: 'Success Stories' }],
    type: 'website',
  },
};

export default async function SuccessStoriesPage() {
  const supabase = await createClient();
  
  const { data: stories } = await supabase
    .from('success_stories')
    .select('*')
    .eq('published', true)
    .order('display_order', { ascending: true });

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px]">
        <Image
          src="/images/success-new/success-1.jpg"
          alt="Graduate Success"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Success Stories' },
              ]}
              className="text-white/80 mb-4"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Success Stories</h1>
            <p className="text-xl text-white/90 max-w-2xl">
              Real graduates. Real careers. Real transformation.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Our Graduates at Work</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            From apprentices to professionals - our graduates are building careers across Indiana in healthcare, skilled trades, and more.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <div key={num} className="relative aspect-square rounded-xl overflow-hidden">
                <Image
                  src={`/images/success-new/success-${num}.jpg`}
                  alt={`Graduate ${num}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stories from Database */}
      {stories && stories.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Graduate Testimonials</h2>
            <div className="space-y-8">
              {stories.map((story) => (
                <div key={story.id} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                  <p className="text-lg text-gray-700 mb-6 italic">"{story.quote}"</p>
                  <div className="flex items-center gap-4">
                    {story.image_url && (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden">
                        <Image src={story.image_url} alt={story.name} fill className="object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900">{story.name}</p>
                      <p className="text-sm text-slate-600">{story.program}</p>
                      {story.current_employer && (
                        <p className="text-sm text-blue-600">Now at {story.current_employer}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Programs Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Programs That Transform Careers</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Our graduates come from diverse programs - all designed to provide real skills for real jobs.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/programs/barber-apprenticeship" className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="relative h-48">
                <Image src="/images/programs/barber-hero.jpg" alt="Barber Apprenticeship" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Barber Apprenticeship</h3>
                <p className="text-slate-600 text-sm mb-4">2,000-hour DOL registered apprenticeship with paid OJT.</p>
                <span className="text-blue-600 font-semibold flex items-center gap-2">
                  Learn More <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
            <Link href="/programs/hvac" className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="relative h-48">
                <Image src="/images/hvac-hero.jpg" alt="HVAC Training" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">HVAC Technician</h3>
                <p className="text-slate-600 text-sm mb-4">Free training through Workforce Ready Grant. 5 certifications included.</p>
                <span className="text-blue-600 font-semibold flex items-center gap-2">
                  Learn More <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
            <Link href="/programs/cna" className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="relative h-48">
                <Image src="/images/programs/cna-hero.jpg" alt="CNA Training" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">CNA Certification</h3>
                <p className="text-slate-600 text-sm mb-4">Fast-track healthcare career in 4-6 weeks. High demand field.</p>
                <span className="text-blue-600 font-semibold flex items-center gap-2">
                  Learn More <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
          <div className="text-center mt-8">
            <Link href="/programs" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
              View All Programs <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Write Your Success Story?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join hundreds of graduates who have transformed their careers through our programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-gray-100 transition"
            >
              Explore Programs
            </Link>
            <Link
              href="/inquiry"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-slate-900 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
