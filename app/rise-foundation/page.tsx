import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Users,
  Sparkles,
  ArrowRight,
  Phone,
  Calendar,
  Shield,
  Gift,
  BookOpen,
  Star,
  MapPin,
  Mail,
  Clock,
  Award,
  Leaf,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Selfish Inc. 501(c)(3) | Rise Foundation | CurvatureBody Sculpting | Indianapolis',
  description:
    'Selfish Inc. is a 501(c)(3) nonprofit operating The Rise Foundation, CurvatureBody Sculpting, Meri-Go-Round wellness products, free VITA tax preparation, mental wellness counseling, trauma recovery, addiction rehabilitation, and community services in Indianapolis, Indiana.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/rise-foundation',
  },
  openGraph: {
    title: 'Selfish Inc. 501(c)(3) | Rise Foundation | Indianapolis',
    description:
      'Mental wellness, CurvatureBody Sculpting, Meri-Go-Round products, holistic healing, free VITA tax prep, and community services in Indianapolis.',
    url: 'https://www.elevateforhumanity.org/rise-foundation',
    siteName: 'Elevate for Humanity',
    type: 'website',
  },
};

export const revalidate = 600;

export default async function RiseFoundationPage() {
  let events: any[] | null = null;
  let testimonials: any[] | null = null;

  try {
    const db = createAdminClient();
    const { data: eventsData } = await db
      .from('events')
      .select('id, title, description, start_date')
      .eq('organization', 'rise-foundation')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(3);
    events = eventsData;

    const { data: testimonialsData } = await db
      .from('testimonials')
      .select('id, content, name')
      .eq('is_featured', true)
      .limit(3);
    testimonials = testimonialsData;
  } catch {
    // DB tables may not exist yet
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Rise Foundation' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
        <Image
          src="/images/pages/rise-foundation-page-2.jpg"
          alt="Selfish Inc. community programs in Indianapolis"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={90}
        />
        
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <p className="text-sm md:text-base text-slate-600 uppercase tracking-wider mb-3">
              501(c)(3) Nonprofit Organization
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-2">
              Selfish Inc.
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-4">
              Operating The Rise Foundation &middot; CurvatureBody Sculpting &middot; Meri-Go-Round Products
            </p>
            <p className="text-lg text-slate-500 max-w-2xl mb-8">
              Mental wellness counseling, body sculpting, holistic healing, free VITA tax preparation, 
              and community services. Serving Indianapolis families with compassion and dignity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/rise-foundation/get-involved"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-white transition text-lg"
              >
                Get Help Now
              </Link>
              <Link
                href="/rise-foundation/donate"
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition text-lg"
              >
                <Gift className="w-5 h-5" />
                Donate
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Entity Info Bar */}
      <section className="bg-brand-blue-700 text-white py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-green-400" />
              501(c)(3) Nonprofit
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-blue-400" />
              Indianapolis, Indiana
            </span>
            <Link href="/pages/selfish-inc.html" className="flex items-center gap-2 hover:text-brand-blue-300">
              <Star className="w-4 h-4 text-amber-400" />
              Selfish Inc.
            </Link>
            <Link href="/curvature-body-sculpting" className="flex items-center gap-2 hover:text-brand-blue-300">
              <Star className="w-4 h-4 text-amber-400" />
              CurvatureBody Sculpting
            </Link>
          </div>
        </div>
      </section>

      {/* Our Programs — Three Pillars */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Selfish Inc. Programs</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Three interconnected programs under one 501(c)(3) nonprofit, serving the whole person — mind, body, and community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Mental Wellness & Healing */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="h-52 relative">
                <Image
                  src="/images/pages/rise-foundation-page-1.jpg"
                  alt="Mental wellness counseling and support services"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-2 text-white">
                    <Heart className="w-5 h-5" />
                    <span className="font-bold text-lg">Mental Wellness</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Counseling, support groups, and holistic healing programs operated by Selfish Inc. 501(c)(3). Confidential services for individuals and families.
                </p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <Link href="/rise-foundation/trauma-recovery" className="text-gray-700 hover:text-brand-blue-600">Mental Wellness Counseling</Link>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <Link href="/rise-foundation/trauma-recovery" className="text-gray-700 hover:text-brand-blue-600">Trauma Recovery</Link>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <Link href="/rise-foundation/divorce-support" className="text-gray-700 hover:text-brand-blue-600">Divorce Support</Link>
                  </li>
                  <li className="flex items-start gap-2">
                    <Leaf className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <Link href="/rise-foundation/addiction-rehabilitation" className="text-gray-700 hover:text-brand-blue-600">Addiction Rehabilitation</Link>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <Link href="/rise-foundation/get-involved" className="text-gray-700 hover:text-brand-blue-600">Young Adult Wellness</Link>
                  </li>
                  <li className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <Link href="/rise-foundation/events" className="text-gray-700 hover:text-brand-blue-600">Workshops &amp; Events</Link>
                  </li>
                </ul>
                <Link href="/rise-foundation" className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline">
                  View All Services <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* CurvatureBody Sculpting */}
            <div id="curvature" className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="h-52 relative">
                <Image
                  src="/images/pages/rise-foundation-page-2.jpg"
                  alt="CurvatureBody Sculpting non-invasive body contouring services"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-bold text-lg">CurvatureBody Sculpting</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Non-invasive body contouring, skin tightening, and wellness services operated by Selfish Inc. 501(c)(3). 
                  Professional treatments using ultrasonic cavitation, radio frequency, and vacuum therapy. 
                  All proceeds fund Rise Foundation community programs.
                </p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Ultrasonic Cavitation — Fat reduction &amp; body contouring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Radio Frequency — Skin tightening &amp; collagen stimulation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Vacuum Therapy — Cellulite reduction &amp; lymphatic drainage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Leaf className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Wood Therapy — Manual body sculpting &amp; contouring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Gift className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                    <Link href="/rise-foundation#products" className="text-gray-700 hover:text-brand-blue-600">Meri-Go-Round Wellness Products</Link>
                  </li>
                  <li className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                    <Link href="/contact?subject=curvature" className="text-gray-700 hover:text-brand-blue-600">Book a Free Consultation</Link>
                  </li>
                </ul>
                <Link href="/curvature-body-sculpting" className="inline-flex items-center gap-1 bg-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-pink-700 transition text-sm">
                  Visit Site <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Community Services & VITA */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="h-52 relative">
                <Image
                  src="/images/pages/community.jpg"
                  alt="Community volunteers at VITA free tax preparation site"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-2 text-white">
                    <Users className="w-5 h-5" />
                    <span className="font-bold text-lg">Community Services</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Free IRS-certified VITA tax preparation, community events, volunteer opportunities, and donation-funded support for Indianapolis families.
                </p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-brand-green-500 mt-0.5 flex-shrink-0" />
                    <Link href="/tax/rise-up-foundation/free-tax-help" className="text-gray-700 hover:text-brand-blue-600">Free VITA Tax Preparation</Link>
                  </li>
                  <li className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-brand-green-500 mt-0.5 flex-shrink-0" />
                    <Link href="/tax/rise-up-foundation/training" className="text-gray-700 hover:text-brand-blue-600">IRS VITA Volunteer Training</Link>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-brand-green-500 mt-0.5 flex-shrink-0" />
                    <Link href="/tax/rise-up-foundation/site-locator" className="text-gray-700 hover:text-brand-blue-600">Find a VITA Site</Link>
                  </li>
                  <li className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-brand-green-500 mt-0.5 flex-shrink-0" />
                    <Link href="/rise-foundation/events" className="text-gray-700 hover:text-brand-blue-600">Community Events</Link>
                  </li>
                  <li className="flex items-start gap-2">
                    <Gift className="w-4 h-4 text-brand-green-500 mt-0.5 flex-shrink-0" />
                    <Link href="/rise-foundation/donate" className="text-gray-700 hover:text-brand-blue-600">Donate</Link>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-brand-green-500 mt-0.5 flex-shrink-0" />
                    <Link href="/rise-foundation/get-involved" className="text-gray-700 hover:text-brand-blue-600">Volunteer</Link>
                  </li>
                </ul>
                <Link href="/tax/rise-up-foundation" className="inline-flex items-center gap-1 text-brand-green-600 font-semibold hover:underline">
                  VITA Tax Services <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meri-Go-Round Products */}
      <section id="products" className="py-16 bg-pink-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 rounded-full text-pink-700 text-sm font-medium mb-4">
              <Heart className="w-4 h-4" />
              Meri-Go-Round Wellness Products
            </div>
            <h2 className="text-3xl font-bold mb-4">Handcrafted Wellness Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Handcrafted teas, body butters, essential oils, and soaps to support your wellness journey. 
              All proceeds fund Rise Foundation community programs and mental wellness services.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { name: 'Calm Blend Herbal Tea', price: '$18.99', desc: 'Chamomile, lavender, and lemon balm loose-leaf blend. Caffeine-free. Promotes relaxation and restful sleep.', image: '/images/pages/community-page-1.jpg' },
              { name: 'Shea Body Butter — Lavender', price: '$24.99', desc: 'Whipped shea butter with lavender essential oil and vitamin E. Deep moisture for dry skin. 8 oz jar.', image: '/images/pages/community-page-3.jpg' },
              { name: 'Essential Oil Collection', price: '$44.99', desc: '6-oil starter set: lavender, peppermint, eucalyptus, tea tree, lemon, and frankincense. 10ml bottles.', image: '/images/pages/community-page-5.jpg' },
              { name: 'Handmade Soap Set (4 bars)', price: '$22.99', desc: 'Cold-process soaps: oatmeal honey, charcoal detox, lavender calm, and citrus energy. Natural ingredients.', image: '/images/pages/community-page-7.jpg' },
            ].map((product) => (
              <div key={product.name} className="bg-white rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition">
                <div className="relative h-40 overflow-hidden">
                  <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 25vw" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-pink-600 font-bold mb-2">{product.price}</p>
                  <p className="text-gray-600 text-sm mb-4">{product.desc}</p>
                  <Link
                    href="/contact?subject=products"
                    className="inline-flex items-center gap-1 bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-pink-700 transition"
                  >
                    Order Now
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">Custom orders and wholesale pricing available. Contact us for bulk orders or gift sets.</p>
            <Link
              href="/contact?subject=products"
              className="inline-flex items-center gap-2 border-2 border-pink-600 text-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-pink-50 transition"
            >
              Contact for Custom Orders <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Entity Structure */}
      <section id="organization" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-2">Our Organization</h2>
          <p className="text-center text-gray-500 mb-10 text-sm">Legal entity and operating names explained</p>
          <div className="bg-white rounded-2xl border shadow-sm p-8">
            <div className="space-y-6">
              {/* Legal entity */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg">Selfish Inc.</h3>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Legal Entity · 501(c)(3)</span>
                  </div>
                  <p className="text-gray-600 mt-1">The registered 501(c)(3) nonprofit corporation. All programs, services, and DBAs operate under Selfish Inc. as the legal entity. Founded by Elizabeth Greene.</p>
                  <Link href="/pages/selfish-inc.html" className="text-brand-blue-600 text-sm hover:underline mt-1 inline-block">Selfish Inc. site →</Link>
                </div>
              </div>

              {/* DBA tree */}
              <div className="ml-6 border-l-2 border-slate-200 pl-10 space-y-6">

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-brand-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold">The Rise Foundation</h4>
                      <span className="text-xs bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded-full font-semibold">DBA of Selfish Inc.</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">The public-facing name for Selfish Inc.'s community programs. Mental wellness counseling, trauma recovery, divorce support, addiction rehabilitation, and young adult wellness services.</p>
                    <Link href="/curvature-body-sculpting" className="text-brand-blue-600 text-sm hover:underline mt-1 inline-block">CurvatureBody Sculpting site →</Link>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold">CurvatureBody Sculpting</h4>
                      <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-semibold">Program of Selfish Inc.</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">Non-invasive body contouring and wellness services. Ultrasonic cavitation, radio frequency, vacuum therapy, and wood therapy. All proceeds fund Rise Foundation community programs.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold">VITA Free Tax Preparation</h4>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Program of Selfish Inc.</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">IRS-certified Volunteer Income Tax Assistance (VITA) site. Free tax preparation for qualifying Indianapolis families. Operated by Elizabeth Greene, IRS Enrolled Agent (EA) with EFIN and PTIN.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events from DB */}
      {events && events.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Upcoming Events</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((event: any) => (
                <div key={event.id} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center gap-2 text-brand-blue-600 text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.start_date).toLocaleDateString()}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                  <p className="text-gray-600 text-sm">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials from DB */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-16 bg-brand-blue-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Stories of Hope</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t: any) => (
                <div key={t.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <p className="text-gray-600 italic mb-4">&ldquo;{t.content}&rdquo;</p>
                  <p className="font-medium">&mdash; {t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Founder */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Founded by Elizabeth Greene</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-lg">
            Elizabeth Greene founded Selfish Inc. 501(c)(3) with a simple belief: investing in yourself is not selfish — it&apos;s necessary. The Rise Foundation serves Indianapolis families through mental wellness, holistic healing, body sculpting, and workforce development.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/founder" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition">
              Meet the Founder <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/rise-foundation#organization" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-brand-blue-600 text-brand-blue-600 font-bold rounded-lg hover:bg-brand-blue-50 transition">
              About Selfish Inc.
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Support Our Mission</h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Your donation funds mental wellness services, community workshops, free tax preparation, and holistic healing programs for families in need. All services are confidential.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/rise-foundation/donate" className="inline-flex items-center justify-center gap-2 bg-white text-slate-800 px-8 py-4 rounded-xl font-bold hover:bg-white transition">
              <Gift className="w-5 h-5" /> Donate Now
            </Link>
            <Link href="/rise-foundation/get-involved" className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition">
              <Users className="w-5 h-5" /> Volunteer
            </Link>
            <a href="/support" className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition">
              <Phone className="w-5 h-5" /> Get Help
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-sm">
            <span>Crisis Line Available 24/7</span>
            <span>&middot;</span>
            <span>All Services Confidential</span>
            <span>&middot;</span>
            <span>Selfish Inc. is a registered 501(c)(3)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
