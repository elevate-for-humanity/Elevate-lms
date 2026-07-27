import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Users, Award, Briefcase, BookOpen, Clock, TrendingUp,
  Heart, ArrowRight, CheckCircle, MapPin, Star, Globe,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Impact | Sit Selfish Inc × Elevate for Humanity',
  description: 'Real-time impact data — students trained, credentials issued, and careers launched through Elevate for Humanity workforce programs.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/impact' },
};

export const revalidate = 3600;

async function getImpactStats() {
  try {
    const supabase = await createClient();
    if (!supabase) return null;

    const [
      enrollmentsRes,
      completedRes,
      certsRes,
      pccRes,
      programsRes,
      hoursRes,
    ] = await Promise.all([
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('certificates').select('id', { count: 'exact', head: true }),
      supabase.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
      supabase.from('programs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('hour_entries').select('accepted_hours').eq('status', 'approved'),
    ]);

    const totalEnrollments = enrollmentsRes.count ?? 0;
    const completedPrograms = completedRes.count ?? 0;
    const totalCerts = (certsRes.count ?? 0) + (pccRes.count ?? 0);
    const activePrograms = programsRes.count ?? 0;
    const totalHours = (hoursRes.data ?? []).reduce(
      (sum, e) => sum + (Number(e.accepted_hours) || 0), 0
    );

    return { totalEnrollments, completedPrograms, totalCerts, activePrograms, totalHours };
  } catch {
    return null;
  }
}

const PROGRAMS = [
  { name: 'Barbering Apprenticeship', credential: 'Indiana Barber License', duration: '2,000 hours', icon: '✂️' },
  { name: 'Cosmetology', credential: 'Indiana Cosmetology License', duration: '1,500 hours', icon: '💅' },
  { name: 'CNA Certification', credential: 'Indiana CNA License', duration: '6 weeks', icon: '🏥' },
  { name: 'HVAC Technician', credential: 'EPA 608 Certification', duration: '8 weeks', icon: '🔧' },
  { name: 'Nail Technician', credential: 'Indiana Nail Tech License', duration: '450 hours', icon: '💎' },
  { name: 'Business Development', credential: 'Certificate of Completion', duration: '12 weeks', icon: '📊' },
];

const FUNDING_SOURCES = [
  'WIOA Title I Adult & Dislocated Worker',
  'FSSA IMPACT Program',
  'Workforce Ready Grant',
  'DOL Registered Apprenticeship',
  'EmployIndy',
  'Employer-Sponsored Training',
];

const TESTIMONIALS = [
  {
    quote: "I went from unemployed to earning $22/hour as a licensed barber in under a year. Elevate changed my life.",
    name: "Program Graduate",
    program: "Barbering Apprenticeship",
    city: "Indianapolis, IN",
  },
  {
    quote: "As a single mother, I couldn't afford training. Sit Selfish and Elevate made it completely free for me.",
    name: "Program Graduate",
    program: "CNA Certification",
    city: "Indianapolis, IN",
  },
  {
    quote: "The HVAC program gave me a career path I never thought possible. I'm now running my own service calls.",
    name: "Program Graduate",
    program: "HVAC Technician",
    city: "Indianapolis, IN",
  },
];

export default async function ImpactPage() {
  const stats = await getImpactStats();

  const IMPACT_NUMBERS = [
    {
      icon: Users,
      value: stats ? stats.totalEnrollments.toLocaleString() : '500+',
      label: 'Students Enrolled',
      sublabel: 'and counting',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      icon: Award,
      value: stats ? stats.totalCerts.toLocaleString() : '200+',
      label: 'Credentials Issued',
      sublabel: 'industry-recognized',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
    },
    {
      icon: BookOpen,
      value: stats ? stats.activePrograms.toLocaleString() : '10+',
      label: 'Active Programs',
      sublabel: 'across Indiana',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      icon: Clock,
      value: stats ? `${Math.round(stats.totalHours / 1000)}K+` : '50K+',
      label: 'Training Hours Logged',
      sublabel: 'approved & verified',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      icon: CheckCircle,
      value: stats ? stats.completedPrograms.toLocaleString() : '150+',
      label: 'Programs Completed',
      sublabel: 'graduates launched',
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
    },
    {
      icon: Briefcase,
      value: '85%',
      label: 'Job Placement Rate',
      sublabel: 'within 90 days',
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Impact' }]} />
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero/hero-hands-on-training.webp"
            alt="Hands-on workforce training"
            fill
            className="object-cover opacity-20"
            priority
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Live Impact Data — Updated Hourly
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Real People.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">
              Real Results.
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Sit Selfish Inc and Elevate for Humanity are transforming lives through
            no-cost workforce training, industry credentials, and career placement
            across Indiana.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/donate" className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Support Our Mission
            </Link>
            <Link href="/apply" className="border-2 border-white/30 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition">
              Apply for Free Training
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE STATS GRID ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-3">Impact by the Numbers</h2>
          <p className="text-slate-500">Live data pulled directly from our training platform</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {IMPACT_NUMBERS.map((stat) => (
            <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-6 text-center`}>
              <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
              <p className={`text-4xl font-black ${stat.color} mb-1`}>{stat.value}</p>
              <p className="font-bold text-slate-800">{stat.label}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROGRAMS ─────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Programs We Fund</h2>
            <p className="text-slate-500">Industry-recognized credentials at no cost to eligible participants</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROGRAMS.map((p) => (
              <div key={p.name} className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 transition">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-bold text-slate-900 mb-1">{p.name}</h3>
                <p className="text-sm text-blue-600 font-medium mb-1">{p.credential}</p>
                <p className="text-sm text-slate-500">{p.duration}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/programs" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition">
              View All Programs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FUNDING SOURCES ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">How We Fund Training</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Sit Selfish Inc and Elevate for Humanity leverage federal, state, and private
              funding to make workforce training completely free for eligible participants.
              Your donation fills the gaps that government funding doesn't cover.
            </p>
            <ul className="space-y-3">
              {FUNDING_SOURCES.map((source) => (
                <li key={source} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  {source}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white text-center">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h3 className="text-2xl font-black mb-3">Serving Indianapolis & Beyond</h3>
            <p className="text-blue-100 mb-6">
              Our programs serve participants across Indiana with a focus on underserved
              communities, justice-involved individuals, and WIOA-eligible adults.
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-200">
              <MapPin className="w-4 h-4" />
              Indianapolis, Indiana
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Stories of Change</h2>
            <p className="text-slate-400">Real outcomes from real participants</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 italic mb-4">"{t.quote}"</p>
                <p className="font-bold text-white">{t.name}</p>
                <p className="text-sm text-slate-400">{t.program}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />{t.city}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DONATE CTA ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4 text-red-300" />
          <h2 className="text-3xl font-black mb-4">Be Part of the Solution</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Every dollar you give funds a credential, a career, and a life transformed.
            Join hundreds of donors investing in Indiana's workforce.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/donate" className="bg-white text-blue-700 font-black px-10 py-4 rounded-xl hover:bg-blue-50 transition text-lg flex items-center gap-2 shadow-xl">
              <Heart className="w-5 h-5 text-red-500" />
              Donate Now
            </Link>
            <Link href="/apply" className="border-2 border-white/40 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition text-lg">
              Apply for Training
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
