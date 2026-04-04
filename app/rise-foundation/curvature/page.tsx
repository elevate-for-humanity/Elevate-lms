import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Star, Phone, Mail, ArrowRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CurvatureBody Sculpting | Selfish Inc. | Non-Invasive Body Contouring Indianapolis',
  description:
    'Non-invasive body contouring, skin tightening, and wellness services in Indianapolis. Ultrasonic cavitation, radio frequency, vacuum therapy, wood therapy, and more. Operated by Selfish Inc. 501(c)(3).',
  alternates: { canonical: 'https://www.elevateforhumanity.org/rise-foundation/curvature' },
};

const SERVICES = [
  {
    name: 'Ultrasonic Cavitation',
    desc: 'Non-invasive fat reduction using low-frequency ultrasound waves to break down fat cells. Targets stubborn areas without surgery or downtime.',
    tag: 'Fat Reduction',
    tagColor: 'bg-pink-100 text-pink-700',
  },
  {
    name: 'Radio Frequency Skin Tightening',
    desc: 'Stimulates collagen production to firm and tighten loose skin. Effective for the abdomen, arms, thighs, and face.',
    tag: 'Skin Tightening',
    tagColor: 'bg-purple-100 text-purple-700',
  },
  {
    name: 'Vacuum Therapy',
    desc: 'Suction-based treatment that lifts and tones targeted areas, improves circulation, and reduces the appearance of cellulite.',
    tag: 'Contouring',
    tagColor: 'bg-rose-100 text-rose-700',
  },
  {
    name: 'Wood Therapy',
    desc: 'Manual body sculpting and contouring using wooden instruments. Breaks down fat deposits, reduces cellulite, and defines body shape.',
    tag: 'Manual Sculpting',
    tagColor: 'bg-amber-100 text-amber-700',
  },
  {
    name: 'Lipo Laser',
    desc: 'Low-level laser therapy that targets fat cells and stimulates the body\'s natural process of releasing stored fat. Painless and non-invasive.',
    tag: 'Laser Therapy',
    tagColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Body Wraps',
    desc: 'Detoxifying and slimming body wraps that reduce water retention, smooth skin texture, and promote relaxation.',
    tag: 'Wellness',
    tagColor: 'bg-green-100 text-green-700',
  },
];

const WHY = [
  'Non-invasive — no surgery, no needles, no downtime',
  'Operated by Selfish Inc. 501(c)(3) — wellness with purpose',
  'Personalized treatment plans for your body goals',
  'Experienced, certified technicians',
  'Comfortable, private, professional environment',
  'Indianapolis-based — serving Marion County and surrounding areas',
];

export default function CurvaturePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero — clean image, no overlay */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] overflow-hidden">
        <Image
          src="/images/pages/admin-api-keys-hero.jpg"
          alt="CurvatureBody Sculpting non-invasive body contouring Indianapolis"
          fill sizes="100vw"
          className="object-cover object-center"
          priority
        />
      </section>

      {/* Identity — below the hero */}
      <section className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Selfish Inc. 501(c)(3)</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
            CurvatureBody Sculpting
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl">
            Non-invasive body contouring, skin tightening, and wellness services. Indianapolis, Indiana.
          </p>
        </div>
      </section>

      {/* DBA notice */}
      <div className="bg-pink-50 border-b border-pink-100 py-3 px-6 text-center text-sm text-pink-800">
        CurvatureBody Sculpting is operated by <strong>Selfish Inc.</strong> — a 501(c)(3) nonprofit organization d/b/a The Rise Foundation.
      </div>

      <div className="max-w-5xl mx-auto px-6 py-14">

        {/* Intro */}
        <div className="max-w-3xl mb-14">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Feel Good. Look Good. Invest in Yourself.</h2>
          <p className="text-slate-600 leading-relaxed text-lg mb-4">
            CurvatureBody Sculpting offers professional non-invasive body contouring treatments in a comfortable, private setting. Our services are designed for people who want real results without surgery, needles, or recovery time.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Every treatment is personalized to your body and your goals. Whether you&apos;re targeting stubborn fat, loose skin, or cellulite — we build a plan that works for you.
          </p>
        </div>

        {/* Services */}
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Services</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {SERVICES.map(({ name, desc, tag, tagColor }) => (
            <div key={name} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <Sparkles className="w-5 h-5 text-pink-500 mt-0.5" />
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{name}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Why Curvature */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 mb-14">
          <h2 className="text-2xl font-bold mb-6">Why CurvatureBody Sculpting</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {WHY.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/80 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Book */}
        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-8 text-center mb-10">
          <Star className="w-8 h-8 text-pink-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Book a Free Consultation</h2>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">
            Not sure which treatment is right for you? Start with a free consultation. We&apos;ll assess your goals and build a personalized plan.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact?subject=curvature"
              className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-3 rounded-lg transition"
            >
              <Mail className="w-4 h-4" /> Book Online
            </Link>
            <a
              href="tel:+13173143757"
              className="inline-flex items-center gap-2 border border-pink-300 text-pink-700 font-bold px-6 py-3 rounded-lg hover:bg-pink-50 transition"
            >
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
          </div>
        </div>

        {/* Meri-Go-Round Products teaser */}
        <div className="border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 mb-1">Meri-Go-Round Wellness Products</h3>
            <p className="text-slate-600 text-sm">
              Complement your body sculpting treatments with Selfish Inc.&apos;s Meri-Go-Round wellness product line — designed to support your results between sessions.
            </p>
          </div>
          <Link
            href="/rise-foundation#products"
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition text-sm flex-shrink-0"
          >
            Shop Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Back nav */}
      <div className="border-t border-slate-100 py-6 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/rise-foundation" className="text-pink-600 hover:underline text-sm font-medium">
            ← Back to Rise Foundation
          </Link>
        </div>
      </div>
    </div>
  );
}
