import { Metadata } from 'next';
import Link from 'next/link';
import { Star, Quote } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata = buildMetadata({
  title: 'Testimonials',
  description: `Stories from ${PLATFORM_DEFAULTS.orgName} graduates and partners.`,
  path: '/testimonials',
});

export const revalidate = 3600;

async function getTestimonials() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('testimonials')
      .select('id,name,role,company,quote,image_url,program_slug,rating,featured')
      .eq('approved', true)
      .order('featured', { ascending: false })
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();
  const featured = testimonials.filter((t) => t.featured);
  const rest = testimonials.filter((t) => !t.featured);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Testimonials</h1>
      <p className="mt-4 text-slate-600 text-lg">
        Stories from {PLATFORM_DEFAULTS.orgName} graduates and partners.
      </p>

      {testimonials.length === 0 ? (
        <div className="mt-12 text-center py-16 bg-slate-50 rounded-2xl">
          <Quote className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-2">No published testimonials yet.</p>
          <p className="text-slate-400 text-sm">Be the first to share your experience with {PLATFORM_DEFAULTS.orgName}.</p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-slate-800 transition">
              Apply Now
            </Link>
            <a href="mailto:info@elevateforhumanity.org" className="rounded border px-5 py-3 hover:bg-slate-50 transition">
              Contact Us
            </a>
          </div>
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {featured.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} featured />
              ))}
            </div>
          )}
          {rest.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
          )}
          <div className="mt-12 flex gap-4">
            <Link href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-slate-800 transition">
              Apply Now
            </Link>
            <a href="mailto:info@elevateforhumanity.org" className="rounded border px-5 py-3 hover:bg-slate-50 transition">
              Contact Us
            </a>
          </div>
        </>
      )}
    </section>
  );
}

function TestimonialCard({
  testimonial,
  featured = false,
}: {
  testimonial: {
    id: string;
    name: string;
    role?: string | null;
    company?: string | null;
    quote: string;
    image_url?: string | null;
    program_slug?: string | null;
    rating?: number | null;
  };
  featured?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border p-6 flex flex-col gap-4 ${featured ? 'border-blue-200 shadow-md' : 'border-slate-200'}`}>
      <Quote className="w-8 h-8 text-blue-200" />
      <p className="text-slate-700 leading-relaxed flex-1">"{testimonial.quote}"</p>
      {testimonial.rating && (
        <div className="flex gap-0.5">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        {testimonial.image_url ? (
          // IMAGE-CONTRACT: allow raw img because image_url is a user-supplied external URL incompatible with next/image domain config
          <img src={testimonial.image_url} alt={testimonial.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
            {testimonial.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-slate-900 text-sm">{testimonial.name}</p>
          {(testimonial.role || testimonial.company) && (
            <p className="text-xs text-slate-500">
              {[testimonial.role, testimonial.company].filter(Boolean).join(' · ')}
            </p>
          )}
          {testimonial.program_slug && (
            <Link href={`/programs/${testimonial.program_slug}`} className="text-xs text-blue-600 hover:underline">
              View Program →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
