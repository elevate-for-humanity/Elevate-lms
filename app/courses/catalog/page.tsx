'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Play, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ScrollVideo } from '@/components/video/ScrollVideo';

// Real actor videos already in the repo — mapped per course
const PREVIEW_VIDEOS: Record<string, string> = {
  'hvac-technician':   '/videos/hvac-technician.mp4',
  'cna':               '/videos/cna-welcome.mp4',
  'cdl':               '/videos/cdl-hero.mp4',
  'tax-preparation':   '/videos/tax-career-paths.mp4',
  'medical-assistant': '/videos/healthcare-cna.mp4',
  'phlebotomy':        '/videos/healthcare-cna.mp4',
  'ekg':               '/videos/healthcare-cna.mp4',
  'it-cybersecurity':  '/videos/it-technology.mp4',
  'it-python':         '/videos/it-technology.mp4',
  'mos-excel':         '/videos/business-finance.mp4',
  'quickbooks':        '/videos/business-finance.mp4',
  'osha-10-construction': '/videos/welding-trades.mp4',
  'osha-30-general':   '/videos/welding-trades.mp4',
  'rise-barbering':    '/videos/barber-course-intro-with-voice.mp4',
  'cpr-combo':         '/videos/cna-professionalism.mp4',
  'customer-service':  '/videos/career-services-hero.mp4',
};
const previewUrl = (id: string) => PREVIEW_VIDEOS[id] ?? '/videos/elevate-overview-with-narration.mp4';

// ─── Course data — student-friendly descriptions, salary info, real photos ───

const ELEVATE_PROGRAMS = [
  {
    id: 'hvac-technician',
    title: 'HVAC Technician',
    tagline: 'Install and repair heating & cooling systems',
    description:
      'Learn to install, maintain, and repair the heating and air conditioning systems in homes and businesses. You will earn the EPA 608 certification — required by law to work with refrigerants. Every building needs HVAC. This job is always in demand.',
    salary: '$45,000–$75,000/yr',
    jobTitle: 'HVAC Technician',
    duration: '12 weeks',
    photo: '/images/pages/courses-page-4.jpg',
    videoId: null,
    price: 'Grant funded',
    badge: 'Most Popular',
    badgeColor: 'bg-brand-orange-500',
    href: '/programs/hvac-technician',
    credentials: ['EPA 608 Universal', 'OSHA 10-Hour', 'ACT WorkKeys'],
  },
  {
    id: 'cna',
    title: 'Certified Nursing Assistant (CNA)',
    tagline: 'Care for patients in hospitals and nursing homes',
    description:
      'CNAs help nurses care for patients — taking vital signs, helping with daily activities, and providing comfort. This is one of the fastest ways to start a healthcare career. Indiana requires state certification, which you will earn in this program.',
    salary: '$32,000–$42,000/yr',
    jobTitle: 'Certified Nursing Assistant',
    duration: '6 weeks',
    photo: '/images/hp/healthcare.jpg',
    videoId: null,
    price: 'Grant funded',
    badge: 'High Demand',
    badgeColor: 'bg-brand-green-600',
    href: '/programs/cna',
    credentials: ['Indiana CNA Certification', 'CPR/AED', 'OSHA 10-Hour'],
  },
  {
    id: 'cdl',
    title: 'Commercial Driver (CDL-A)',
    tagline: 'Drive semi-trucks and earn top pay',
    description:
      'A CDL-A license lets you drive 18-wheelers across the country. Trucking companies are desperate for drivers and many will pay your training costs and offer signing bonuses. This is one of the highest-paying jobs you can get without a college degree.',
    salary: '$55,000–$85,000/yr',
    jobTitle: 'CDL-A Truck Driver',
    duration: '8 weeks',
    photo: '/images/hp/candidates.jpg',
    videoId: null,
    price: 'Grant funded',
    badge: 'Signing Bonuses',
    badgeColor: 'bg-brand-blue-600',
    href: '/programs/cdl',
    credentials: ['CDL-A License', 'DOT Medical Card', 'HazMat Endorsement'],
  },
  {
    id: 'tax-preparation',
    title: 'Tax Preparation',
    tagline: 'Prepare tax returns and run your own business',
    description:
      'Learn to prepare federal and state tax returns for individuals and small businesses. Tax season runs January–April and many preparers earn $3,000–$8,000 in just those four months. You can work for a firm or start your own business.',
    salary: '$35,000–$60,000/yr',
    jobTitle: 'Tax Preparer / Enrolled Agent',
    duration: '10 weeks',
    photo: '/images/tax-prep.jpg',
    videoId: null,
    price: 'Grant funded',
    badge: 'Start a Business',
    badgeColor: 'bg-brand-red-600',
    href: '/programs/tax-preparation',
    credentials: ['IRS PTIN', 'CTEC (CA)', 'QuickBooks Certified'],
  },
];

const PARTNER_COURSES = [
  // Healthcare
  {
    id: 'ccma', provider: 'NHA / JRI', category: 'Healthcare',
    title: 'Medical Assistant (CCMA)',
    tagline: 'Work alongside doctors in clinics and hospitals',
    description: 'Medical assistants take patient histories, draw blood, give injections, and handle office tasks. This certification is recognized at clinics and hospitals nationwide. No prior experience needed.',
    salary: '$36,000–$48,000/yr', jobTitle: 'Certified Clinical Medical Assistant',
    duration: '120 hrs', price: 225, photo: '/images/pages/courses-page-6.jpg',
    videoId: null, href: '/courses/catalog',
    credentials: ['CCMA Certification'],
  },
  {
    id: 'cpt', provider: 'NHA / JRI', category: 'Healthcare',
    title: 'Phlebotomy Technician (CPT)',
    tagline: 'Draw blood samples in labs and hospitals',
    description: 'Phlebotomists draw blood for lab tests. It sounds simple but it requires precision and calm under pressure. Hospitals, clinics, and blood banks all need phlebotomists. Short training, steady work.',
    salary: '$33,000–$42,000/yr', jobTitle: 'Certified Phlebotomy Technician',
    duration: '80 hrs', price: 225, photo: '/images/pages/courses-page-7.jpg',
    videoId: null, href: '/courses/catalog',
    credentials: ['CPT Certification'],
  },
  {
    id: 'ekg', provider: 'NHA / JRI', category: 'Healthcare',
    title: 'EKG Technician (CET)',
    tagline: 'Monitor heart activity in hospitals',
    description: 'EKG technicians attach electrodes to patients and record heart activity. Cardiologists and hospitals rely on this data to diagnose heart conditions. Quick to learn, always needed.',
    salary: '$34,000–$46,000/yr', jobTitle: 'Certified EKG Technician',
    duration: '60 hrs', price: 225, photo: '/images/pages/courses-page-8.jpg',
    videoId: null, href: '/courses/catalog',
    credentials: ['CET Certification'],
  },
  // IT & Tech
  {
    id: 'it-cybersecurity', provider: 'Certiport', category: 'Technology',
    title: 'Cybersecurity Specialist',
    tagline: 'Protect computers and networks from hackers',
    description: 'Cybersecurity is one of the fastest-growing fields in tech. You will learn how to protect networks, detect threats, and respond to attacks. Companies of every size need this skill and pay well for it.',
    salary: '$55,000–$90,000/yr', jobTitle: 'IT Security Specialist',
    duration: '40 hrs', price: 176, photo: '/images/pages/courses-page-9.jpg',
    videoId: null, href: '/courses/catalog',
    credentials: ['IT Specialist: Cybersecurity'],
  },
  {
    id: 'it-python', provider: 'Certiport', category: 'Technology',
    title: 'Python Programming',
    tagline: 'Write code and automate tasks with Python',
    description: 'Python is the most popular programming language in the world. It is used in data science, automation, web development, and AI. This certification proves you can write real Python code to employers.',
    salary: '$60,000–$100,000/yr', jobTitle: 'Python Developer / Data Analyst',
    duration: '50 hrs', price: 176, photo: '/images/pages/courses-page-10.jpg',
    videoId: null, href: '/courses/catalog',
    credentials: ['IT Specialist: Python'],
  },
  // Office & Business
  {
    id: 'mos-excel', provider: 'Certiport', category: 'Business',
    title: 'Microsoft Excel Certification',
    tagline: 'Master spreadsheets — every office needs this',
    description: 'Excel is used in every industry — accounting, healthcare, logistics, retail. Knowing Excel well makes you more valuable in almost any job. This Microsoft certification proves your skills to employers.',
    salary: '$38,000–$55,000/yr', jobTitle: 'Office Administrator / Data Analyst',
    duration: '40 hrs', price: 176, photo: '/images/pages/courses-page-11.jpg',
    videoId: null, href: '/courses/catalog',
    credentials: ['MOS: Excel Associate'],
  },
  {
    id: 'quickbooks', provider: 'Certiport', category: 'Business',
    title: 'QuickBooks Bookkeeping',
    tagline: 'Manage business finances and payroll',
    description: 'Small businesses run on QuickBooks. Bookkeepers who know it are always in demand. You can work for a company or freelance from home doing books for multiple clients. This certification is recognized by employers nationwide.',
    salary: '$40,000–$58,000/yr', jobTitle: 'Bookkeeper / Accounting Clerk',
    duration: '40 hrs', price: 225, photo: '/images/pages/courses-page-12.jpg',
    videoId: null, href: '/courses/catalog',
    credentials: ['Intuit Certified QuickBooks User'],
  },
  // Safety
  {
    id: 'osha-10-construction', provider: 'CareerSafe', category: 'Safety',
    title: 'OSHA 10-Hour Construction',
    tagline: 'Required safety card for construction jobs',
    description: 'Most construction employers require an OSHA 10 card before you can set foot on a job site. This 10-hour course covers fall protection, electrical safety, and hazard recognition. Get the card, get hired.',
    salary: 'Required for most construction jobs', jobTitle: 'Construction Worker / Laborer',
    duration: '10 hrs', price: 38, photo: '/images/pages/courses-page-13.jpg',
    videoId: null, href: '/courses/catalog',
    credentials: ['OSHA 10-Hour Card'],
  },
  {
    id: 'osha-30-general', provider: 'CareerSafe', category: 'Safety',
    title: 'OSHA 30-Hour General Industry',
    tagline: 'Safety supervisor certification for any industry',
    description: 'The OSHA 30 is for supervisors and safety leads. It covers everything in the 10-hour plus deeper training on workplace hazard management. Required for many foreman and supervisor positions.',
    salary: 'Required for supervisor roles', jobTitle: 'Safety Supervisor / Foreman',
    duration: '30 hrs', price: 68, photo: '/images/pages/courses-page-14.jpg',
    videoId: null, href: '/courses/catalog',
    credentials: ['OSHA 30-Hour Card'],
  },
  // Beauty
  {
    id: 'rise-barbering', provider: 'Milady', category: 'Beauty & Trades',
    title: 'Barbering Certification',
    tagline: 'Cut hair and build a loyal clientele',
    description: 'Barbers build their own book of clients and can work in a shop or rent a chair and be their own boss. This Milady certification covers cuts, fades, shaves, and business basics. Pair it with your state license.',
    salary: '$35,000–$65,000/yr', jobTitle: 'Barber / Shop Owner',
    duration: '20 hrs', price: 45, photo: '/images/barber-hero.jpg',
    videoId: null, href: '/courses/catalog',
    credentials: ['Milady RISE Barbering'],
  },
  {
    id: 'cpr-combo', provider: 'HSI', category: 'Safety',
    title: 'CPR/AED + First Aid',
    tagline: 'Save a life — required for most healthcare jobs',
    description: 'CPR and First Aid certification is required for healthcare workers, childcare providers, teachers, coaches, and many other jobs. This 3-hour course covers adult, child, and infant CPR plus basic first aid.',
    salary: 'Required for healthcare & childcare jobs', jobTitle: 'Healthcare / Childcare Worker',
    duration: '3 hrs', price: 150, photo: '/images/hp/healthcare.jpg',
    videoId: null, href: '/courses/catalog',
    credentials: ['CPR/AED Certification', 'First Aid Certification'],
  },
  {
    id: 'customer-service', provider: 'NRF RISE Up', category: 'Business',
    title: 'Customer Service Fundamentals',
    tagline: 'Get hired in retail, hospitality, or any customer-facing role',
    description: 'Customer service skills are needed in every industry. This free course covers communication, problem-solving, and how to handle difficult situations. A great starting point if you are new to the workforce.',
    salary: '$28,000–$40,000/yr', jobTitle: 'Customer Service Rep / Retail Associate',
    duration: '4 hrs', price: 0, photo: '/images/hp/candidates.jpg',
    videoId: null, href: '/courses/catalog',
    credentials: ['NRF Customer Service Certificate'],
  },
];

// ─── Video preview modal ─────────────────────────────────────────────────────
function VideoModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-black">✕</button>
        <video src={url} autoPlay controls playsInline className="w-full aspect-video bg-black" />
        <div className="bg-white px-4 py-3">
          <p className="font-bold text-slate-900 text-sm">{title} — Course Preview</p>
          <p className="text-xs text-slate-500">30-second intro · Full course available after enrollment</p>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = ['All', 'Healthcare', 'Technology', 'Business', 'Safety', 'Beauty & Trades'];

const CATEGORY_COLORS: Record<string, string> = {
  Healthcare:       'bg-brand-green-100 text-brand-green-700',
  Technology:       'bg-brand-blue-100 text-brand-blue-700',
  Business:         'bg-brand-orange-100 text-brand-orange-700',
  Safety:           'bg-brand-red-100 text-brand-red-700',
  'Beauty & Trades':'bg-purple-100 text-purple-700',
};

export default function CoursesCatalogPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return PARTNER_COURSES.filter(c => {
      const matchCat = category === 'All' || c.category === category;
      const matchSearch = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, category]);

  return (
    <div className="min-h-screen bg-white">
      {preview && <VideoModal url={preview.url} title={preview.title} onClose={() => setPreview(null)} />}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Courses' }]} />
        </div>
      </div>

      {/* ── VIDEO HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: 420 }}>
        <div className="absolute inset-0">
          <ScrollVideo
            src="/videos/elevate-overview-with-narration.mp4"
            className="w-full h-full object-cover"
            style={{ minHeight: '420px' }}
          />
          {/* Subtle scrim — readable text without hiding the video */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-16">
          <span className="inline-block bg-brand-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-5">
            Free to Apply · Grant Funding Available
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-5 drop-shadow-lg max-w-3xl">
            Find Your Career.<br />Start Training Today.
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mb-8 leading-relaxed">
            Every course below leads to a real job with real pay. No college degree required. Many are fully covered by workforce grants — meaning <strong className="text-white">you pay nothing</strong>.
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses — try 'healthcare', 'tech', 'safety'..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-slate-900 text-sm font-medium shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
            />
          </div>
        </div>
      </section>

      {/* ── ELEVATE FLAGSHIP PROGRAMS ───────────────────────────────── */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Elevate Flagship Programs</h2>
              <p className="text-slate-500 mt-1">Full career training programs — most covered 100% by workforce grants.</p>
            </div>
            <Link href="/programs" className="hidden sm:flex items-center gap-1 text-brand-blue-600 font-semibold text-sm hover:underline">
              View all programs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ELEVATE_PROGRAMS.map(p => (
              <div key={p.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100">
                {/* Photo with play button */}
                <div className="relative h-44 overflow-hidden">
                  <Image src={p.photo} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:640px) 100vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {p.badge && (
                    <span className={`absolute top-3 left-3 text-xs font-bold text-white px-2.5 py-1 rounded-full ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  )}
                  {/* Play preview button */}
                  <button
                    onClick={() => setPreview({ url: previewUrl(p.id), title: p.title })}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    aria-label={`Watch ${p.title} preview`}
                  >
                    <Play className="w-4 h-4 ml-0.5 text-brand-blue-600" />
                  </button>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-extrabold text-base leading-snug drop-shadow">{p.title}</p>
                    <p className="text-white/80 text-xs mt-0.5">{p.tagline}</p>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">{p.description}</p>

                  {/* Salary + duration */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-bold text-brand-green-700 bg-brand-green-50 px-2 py-1 rounded-lg">{p.salary}</span>
                    <span className="text-slate-400">{p.duration}</span>
                  </div>

                  {/* Credentials */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {p.credentials.map(c => (
                      <span key={c} className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-blue-700 bg-brand-blue-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-2.5 h-2.5" />{c}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-green-600">{p.price}</span>
                    <Link href={p.href} className="text-xs font-bold text-brand-blue-600 hover:underline flex items-center gap-1">
                      Learn more <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER COURSES ─────────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">All Courses</h2>
            <p className="text-slate-500">Short certifications you can stack on top of your main program — or take on their own.</p>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  category === cat
                    ? 'bg-brand-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Course cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(c => (
              <div key={c.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100">
                {/* Photo with optional play button */}
                <div className="relative h-40 overflow-hidden">
                  <Image src={c.photo} alt={c.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:640px) 100vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Category badge */}
                  <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[c.category] ?? 'bg-slate-100 text-slate-700'}`}>
                    {c.category}
                  </span>

                  {/* Play preview button — always shown */}
                  <button
                    onClick={() => setPreview({ url: previewUrl(c.id), title: c.title })}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    aria-label={`Watch ${c.title} preview`}
                  >
                    <Play className="w-4 h-4 ml-0.5 text-brand-blue-600" />
                  </button>

                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-extrabold text-sm leading-snug drop-shadow">{c.title}</p>
                    <p className="text-white/80 text-xs">{c.tagline}</p>
                  </div>
                </div>

                <div className="p-4">
                  {/* Plain-English description */}
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">{c.description}</p>

                  {/* Job + salary */}
                  <div className="bg-slate-50 rounded-xl p-3 mb-3">
                    <p className="text-xs text-slate-500 mb-0.5">Job you can get</p>
                    <p className="text-sm font-bold text-slate-900">{c.jobTitle}</p>
                    <p className="text-xs font-bold text-brand-green-700 mt-0.5">{c.salary}</p>
                  </div>

                  {/* Duration + funding + CTA */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />{c.duration}
                    </div>
                    <Link href={c.href}
                      className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
                      Enroll Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-500 mb-4">No courses match your search.</p>
              <button onClick={() => { setSearch(''); setCategory('All'); }}
                className="text-brand-blue-600 font-semibold hover:underline">
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── FUNDING BANNER ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-14" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #dc2626 100%)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/10" />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <h2 className="text-3xl font-extrabold text-white mb-3">Not sure which course is right for you?</h2>
          <p className="text-white/85 text-base max-w-xl mx-auto mb-8">
            Talk to an advisor. We will look at your goals, your schedule, and what funding you qualify for — then help you pick the right path.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/apply/student"
              className="bg-white text-brand-red-600 px-10 py-4 rounded-2xl font-extrabold text-base hover:bg-brand-red-50 transition-colors shadow-xl">
              Apply Free — Takes 5 Minutes
            </Link>
            <Link href="/contact"
              className="border-2 border-white/60 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-white/10 transition-colors">
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
