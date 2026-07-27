import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Quote, ArrowRight, Play, CheckCircle, TrendingUp, Heart } from 'lucide-react';
import ModernLandingHero from '@/components/landing/ModernLandingHero';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Success Stories - Real People, Real Results | Elevate for Humanity',
  description:
    'Read inspiring success stories from graduates who transformed their lives through our workforce training programs. Real careers, real impact.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/success-stories',
  },
  openGraph: {
    title: 'Success Stories - Real People, Real Results',
    description:
      'Inspiring stories from graduates who transformed their lives through workforce training.',
    url: 'https://www.elevateforhumanity.org/success-stories',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/og-default.webp', width: 1200, height: 630, alt: 'Success Stories' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Success Stories - Real People, Real Results',
    description: 'Inspiring stories from workforce training graduates.',
    images: ['/og-default.webp'],
  },
};

const successStories = [
  {
    id: 1,
    name: 'Marcus Thompson',
    age: 34,
    program: 'Public Safety & Reentry Specialist',
    image: '/images/learners/reentry-coaching.jpg',
    beforeJob: 'Unemployed after 8 years incarceration',
    afterJob: 'Reentry Specialist at Marion County Corrections',
    salary: '$45,000/year',
    quote:
      "After 8 years of incarceration, I didn't think anyone would give me a chance. The JRI program not only gave me the training I needed, but they believed in me when I didn't believe in myself. Today, I'm a certified reentry specialist helping others find their path, just like someone helped me find mine.",
    story:
      "Marcus came to us through the Justice Reinvestment Initiative with a criminal record and no recent work history. Through our Public Safety & Reentry Specialist program, he earned his national certification and discovered his calling: helping others who've been where he was. Now he works full-time helping formerly incarcerated individuals successfully reintegrate into society.",
    videoContent: true,
  },
  {
    id: 2,
    name: 'Sarah Martinez',
    age: 28,
    program: 'Medical Assistant',
    image: '/images/heroes/workforce-partner-1.jpg',
    beforeJob: 'Retail cashier, $12/hour',
    afterJob: 'Medical Assistant at Community Health Center',
    salary: '$38,000/year',
    quote:
      "I was stuck in retail making minimum wage with no benefits. Now I have a career in healthcare with room to grow. My kids see me going to work in scrubs and they're so proud. This program changed everything for my family.",
    story:
      "Sarah was a single mother of two working retail with no benefits. Through our Medical Assistant program, she completed her training in 10 weeks while we helped with childcare costs. She passed her certification exam on the first try and was hired immediately by a local clinic. She's now pursuing her LPN license.",
    videoContent: true,
  },
  {
    id: 3,
    name: 'James Wilson',
    age: 42,
    program: 'CDL Training',
    image: '/images/heroes/workforce-partner-3.jpg',
    beforeJob: 'Laid off factory worker',
    afterJob: 'Class A CDL Driver for National Carrier',
    salary: '$65,000/year',
    quote:
      "When the factory closed, I thought my career was over at 42. The CDL program gave me a fresh start. I'm making more money than I ever did at the factory, and I actually enjoy what I do. The freedom of the road suits me.",
    story:
      "After 15 years at a local factory, James was laid off when the plant closed. At 42, he felt too old to start over. Our CDL program proved him wrong. In just 6 weeks, he earned his Class A license and was hired by a national carrier. He's now training to become a driver trainer himself.",
    videoContent: true,
  },
  {
    id: 4,
    name: 'Destiny Brown',
    age: 22,
    program: 'Barber Apprenticeship',
    image: '/images/barber-professional.jpg',
    beforeJob: 'Fast food worker, $10/hour',
    afterJob: 'Licensed Barber, owns chair at local shop',
    salary: '$50,000+/year',
    quote:
      "I always loved cutting hair but couldn't afford barber school. The apprenticeship let me earn while I learned. Now I have my own chair, my own clients, and I'm building something that's mine. This is real ownership.",
    story:
      "Destiny was working fast food and cutting friends' hair on the side. Through our Barber Apprenticeship, she worked in a real shop while training, building her clientele from day one. After 18 months, she passed her state board exam and now rents her own chair. She's already planning to open her own shop.",
    videoContent: true,
  },
  {
    id: 5,
    name: 'Robert Chen',
    age: 55,
    program: 'HVAC Technician',
    image: '/images/heroes/workforce-partner-4.jpg',
    beforeJob: 'Unemployed, career change',
    afterJob: 'HVAC Technician at Commercial HVAC Company',
    salary: '$48,000/year',
    quote:
      "At 55, I thought I was too old to learn a trade. I was wrong. The instructors were patient, the hands-on training was excellent, and now I have a skill that's in demand everywhere. Age is just a number when you have the right support.",
    story:
      'Robert spent 30 years in office work before being laid off. At 55, he decided to try something completely different. Our HVAC program gave him hands-on training and industry certifications. Despite his age, he was hired immediately after graduation. His employer values his maturity and work ethic.',
    videoContent: true,
  },
  {
    id: 6,
    name: 'Tamika Johnson',
    age: 31,
    program: 'CNA',
    image: '/images/heroes/workforce-partner-2.jpg',
    beforeJob: 'Unemployed single mother',
    afterJob: 'CNA at Skilled Nursing Facility',
    salary: '$32,000/year + benefits',
    quote:
      'I had been out of work for two years taking care of my kids. I was scared to go back to school, but the CNA program was only 6 weeks and they helped with everything - childcare, transportation, even my uniform. Now I have a job I love and benefits for my family.',
    story:
      "Tamika had been out of the workforce for two years caring for her children. With no recent work history and limited funds, she felt stuck. Our CNA program provided wraparound support including childcare assistance. She completed training in 6 weeks, passed her state exam, and was hired with full benefits. She's now pursuing her QMA certification.",
    videoContent: true,
  },
  {
    id: 7,
    name: 'David Rodriguez',
    age: 26,
    program: 'Workforce Readiness',
    image: '/images/heroes/workforce-partner-5.jpg',
    beforeJob: 'Unemployed youth, no work history',
    afterJob: 'Customer Service Representative at Tech Company',
    salary: '$35,000/year',
    quote:
      "I had never had a real job before. I didn't know how to write a resume or interview. The Workforce Readiness program taught me everything - how to dress, how to talk to employers, how to be professional. They believed in me before I believed in myself.",
    story:
      "David was 26 with no work history and no idea how to get started. Our Workforce Readiness program taught him professional communication, resume writing, and interview skills. We connected him with an employer partner who gave him a chance. He's been promoted twice in 18 months and is now training new hires.",
    videoContent: true,
  },
  {
    id: 8,
    name: 'Lisa Anderson',
    age: 38,
    program: 'Medical Assistant',
    image: '/images/programs/workforce-readiness-hero.webp',
    beforeJob: 'Restaurant server, $25,000/year',
    afterJob: 'Medical Assistant at Family Practice',
    salary: '$40,000/year',
    quote:
      "I spent 15 years in restaurants with no benefits and unpredictable hours. Now I work Monday through Friday with health insurance and paid time off. My back doesn't hurt anymore, and I can actually plan my life. This is what stability feels like.",
    story:
      "After 15 years in the restaurant industry, Lisa's body was breaking down and she had no benefits. Our Medical Assistant program gave her a path to healthcare. She completed her externship at a family practice that hired her immediately. She now has weekends off for the first time in her adult life.",
    videoContent: true,
  },
  {
    id: 9,
    name: 'Kevin Wright',
    age: 29,
    program: 'Building Maintenance',
    image: '/images/facilities-new/facility-1.jpg',
    beforeJob: 'Gig economy worker, inconsistent income',
    afterJob: 'Building Maintenance Technician at Property Management',
    salary: '$42,000/year',
    quote:
      "I was doing DoorDash and Uber, never knowing how much I'd make each week. Now I have a steady paycheck, benefits, and I'm learning skills I can use anywhere. The training was hands-on and practical - exactly what I needed.",
    story:
      "Kevin was stuck in the gig economy with no stability or benefits. Our Building Maintenance program taught him electrical, plumbing, and HVAC basics. He earned multiple certifications and was hired by a large property management company. He's now on track to become a facilities manager.",
    videoContent: true,
  },
  {
    id: 10,
    name: 'Angela Davis',
    age: 45,
    program: 'CNA',
    image: '/images/artlist/cropped/hero-training-2-wide.jpg',
    beforeJob: 'Unemployed after divorce',
    afterJob: 'CNA at Hospital, pursuing LPN',
    salary: '$34,000/year',
    quote:
      "After my divorce, I had to start completely over at 45. I had no recent work experience and no idea what to do. The CNA program gave me a career in just 6 weeks. Now I'm working at a hospital and going back to school for my LPN. It's never too late to start over.",
    story:
      "Angela came to us at 45 after a difficult divorce left her with no income and no recent work history. Our CNA program fast-tracked her into healthcare. She completed training in 6 weeks and was hired by a local hospital. The hospital is now sponsoring her LPN education. She's proof that it's never too late for a fresh start.",
    videoContent: true,
  },
];

export default async function SuccessStoriesPage() {
  // Live counts from DB — no hardcoded metrics on public pages
  const supabase = await createClient().catch(() => null);
  let totalEnrolled = 0;
  let totalCompleted = 0;
  let totalCerts = 0;

  if (supabase) {
    const [enrolledRes, completedRes, certsRes] = await Promise.all([
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
      supabase
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),
      supabase.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    ]);
    totalEnrolled = enrolledRes.count ?? 0;
    totalCompleted = completedRes.count ?? 0;
    totalCerts = certsRes.count ?? 0;
  }

  const completionRate =
    totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Success Stories' }]} />
      </div>
      <ModernLandingHero
        badge="⚡ Real People, Real Results"
        headline="Success"
        accentText="Stories"
        subheadline="Lives transformed through training and opportunity"
        description="Real people who transformed their lives through education, determination, and the right support at the right time."
        imageSrc="/images/learners/reentry-coaching.jpg"
        imageAlt="Success Stories"
        primaryCTA={{ text: 'Read Stories', href: '#stories' }}
        secondaryCTA={{ text: 'Start Your Journey', href: '/apply' }}
        features={[
          totalEnrolled > 0
            ? `${totalEnrolled.toLocaleString()}+ learners enrolled`
            : 'Workforce training that works',
          totalCerts > 0
            ? `${totalCerts.toLocaleString()} credentials issued`
            : 'Industry-recognized credentials',
          completionRate !== null
            ? `${completionRate}% program completion rate`
            : 'Hands-on, employer-aligned training',
        ]}
        imageOnRight={false}
      />

      {/* Impact Stats */}
      <section id="stories" className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center bg-white rounded-xl p-6 shadow-sm">
              <div className="text-4xl font-black text-blue-600 mb-2">
                {totalEnrolled > 0 ? `${totalEnrolled.toLocaleString()}+` : '—'}
              </div>
              <div className="text-sm text-black">Learners Enrolled</div>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-sm">
              <div className="text-4xl font-black text-green-600 mb-2">
                {totalCompleted > 0 ? totalCompleted.toLocaleString() : '—'}
              </div>
              <div className="text-sm text-black">Programs Completed</div>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-sm">
              <div className="text-4xl font-black text-orange-600 mb-2">
                {totalCerts > 0 ? `${totalCerts.toLocaleString()}+` : '—'}
              </div>
              <div className="text-sm text-black">Credentials Issued</div>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-sm">
              <div className="text-4xl font-black text-purple-600 mb-2">
                {completionRate !== null ? `${completionRate}%` : '—'}
              </div>
              <div className="text-sm text-black">Completion Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto space-y-16">
            {successStories.map((story, index) => (
              <div
                key={story.id}
                className={`grid md:grid-cols-2 gap-8 items-center ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Image/Video */}
                <div className={`${index % 2 === 1 ? 'md:order-2' : ''}`}>
                  <div className="relative h-[400px] rounded-2xl overflow-hidden border-4 border-slate-200 group">
                    <Image
                      priority
                      src={story.image}
                      alt={`${story.name} - ${story.program} graduate`}
                      fill
                      sizes="100vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      quality={90}
                    />
                    {story.videoContent && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                          <Play className="w-10 h-10 text-brand-blue-600 ml-1" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-brand-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                      Success Story
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <div className="mb-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">{story.name}</h2>
                    <p className="text-lg text-brand-blue-600 font-semibold">{story.program}</p>
                    <p className="text-sm text-black">Age {story.age}</p>
                  </div>

                  {/* Before/After */}
                  <div className="bg-slate-50 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 uppercase mb-1">Before</div>
                        <div className="text-sm font-semibold text-black">{story.beforeJob}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase mb-1">After</div>
                        <div className="text-sm font-semibold text-brand-green-600">
                          {story.afterJob}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-brand-green-600" />
                        <span className="text-lg font-bold text-brand-green-600">
                          {story.salary}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="relative mb-6">
                    <Quote className="w-8 h-8 text-blue-200 absolute -top-2 -left-2" />
                    <p className="text-lg text-black italic pl-6 leading-relaxed">
                      &quot;{story.quote}&quot;
                    </p>
                  </div>

                  {/* Story */}
                  <p className="text-black leading-relaxed mb-6">{story.story}</p>

                  {/* CTA */}
                  <Link
                    href={`/programs/${story.program.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:text-brand-blue-700 transition"
                  >
                    Learn about {story.program}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Ready to Write Your Success Story?
            </h2>
            <p className="text-base md:text-lg text-blue-100 mb-8">
              Every success story starts with a single step. Take yours today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-brand-blue-600 bg-white rounded-lg hover:bg-slate-50 transition shadow-lg"
              >
                Apply Now - It&apos;s Free
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-white/10 backdrop-blur-sm border-2 border-white rounded-lg hover:bg-white/20 transition"
              >
                View Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Grid */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              What Our Graduates Say
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {successStories.slice(0, 3).map((story) => (
                <div key={story.id} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-black">{story.name}</div>
                      <div className="text-sm text-black">{story.program}</div>
                    </div>
                  </div>
                  <p className="text-sm text-black italic">
                    &quot;{story.quote.substring(0, 150)}...&quot;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
