'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Volume2, VolumeX, Heart, MapPin, ArrowRight, Clock, Menu, X, Phone, Mail, BookOpen, Users, Award, CheckCircle } from 'lucide-react';

const NAV = [
  { label: 'Programs', href: '/programs' },
  { label: 'Healthcare', href: '/programs/healthcare' },
  { label: 'Skilled Trades', href: '/programs/skilled-trades' },
  { label: 'Technology', href: '/programs/technology' },
  { label: 'CDL', href: '/programs/cdl-training' },
  { label: 'Funding', href: '/funding' },
  { label: 'Locations', href: '/locations' },
];

const PROGRAMS = [
  {
    title: 'Healthcare',
    href: '/programs/healthcare',
    image: '/images/pages/workforce-training.jpg',
    icon: '/images/pages/workforce-training.jpg',
    desc: 'CNA, Medical Assistant, Phlebotomy, and more. Hands-on clinical training for in-demand healthcare careers.',
    tags: ['CNA', 'Medical Assistant', 'Phlebotomy', 'CPR & First Aid'],
  },
  {
    title: 'Skilled Trades',
    href: '/programs/skilled-trades',
    image: '/images/pages/hvac-technician.jpg',
    icon: '/images/pages/hvac-technician.jpg',
    desc: 'HVAC, Electrical, Welding, Plumbing, and Construction. Earn industry certifications and start working.',
    tags: ['HVAC', 'Electrical', 'Welding', 'Plumbing'],
  },
  {
    title: 'Technology',
    href: '/programs/technology',
    image: '/images/pages/workforce-training.jpg',
    icon: '/images/pages/workforce-training.jpg',
    desc: 'Cybersecurity, IT Support, Software Development, and Networking. Launch a career in tech.',
    tags: ['Cybersecurity', 'IT Help Desk', 'Software Dev'],
  },
  {
    title: 'CDL & Transportation',
    href: '/programs/cdl-training',
    image: '/images/pages/hvac-technician.jpg',
    icon: '/images/pages/hvac-technician.jpg',
    desc: 'Commercial Driving License training with job placement. Class A and Class B CDL programs.',
    tags: ['CDL Class A', 'CDL Class B', 'Diesel Mechanic'],
  },
  {
    title: 'Beauty & Barbering',
    href: '/programs/barber-apprenticeship',
    image: '/images/pages/workforce-training.jpg',
    icon: '/images/pages/workforce-training.jpg',
    desc: 'Barber apprenticeships and cosmetology training. Learn from licensed professionals in real shop settings.',
    tags: ['Barber Apprenticeship', 'Cosmetology', 'Nail Tech'],
  },
  {
    title: 'Business & Finance',
    href: '/programs/business',
    image: '/images/pages/workforce-training.jpg',
    icon: '/images/pages/workforce-training.jpg',
    desc: 'Bookkeeping, Office Administration, Tax Preparation, and Entrepreneurship programs.',
    tags: ['Bookkeeping', 'Tax Prep', 'Entrepreneurship'],
  },
];

const LOCATIONS = [
  { state: 'Indiana', href: '/career-training-indiana', cities: ['Indianapolis', 'Fort Wayne', 'Evansville'], image: '/images/pages/workforce-training.jpg', desc: 'Main campus. WIOA-eligible programs, apprenticeships, and job placement.' },
  { state: 'Illinois', href: '/career-training-illinois', cities: ['Chicago', 'Aurora', 'Naperville'], image: '/images/pages/workforce-training.jpg', desc: 'Workforce programs across the Chicago metro and statewide.' },
  { state: 'Ohio', href: '/career-training-ohio', cities: ['Columbus', 'Cleveland', 'Cincinnati'], image: '/images/pages/hvac-technician.jpg', desc: 'Career training aligned with Ohio industry demand.' },
  { state: 'Tennessee', href: '/career-training-tennessee', cities: ['Nashville', 'Memphis', 'Knoxville'], image: '/images/pages/hvac-technician.jpg', desc: 'Expanding workforce development across Tennessee.' },
  { state: 'Texas', href: '/career-training-texas', cities: ['Houston', 'Dallas', 'San Antonio'], image: '/images/pages/workforce-training.jpg', desc: 'Trade, healthcare, and technology programs for Texas.' },
];

const STATS = [
  { Icon: BookOpen, value: '30+', label: 'Training Programs' },
  { Icon: Users, value: '5', label: 'States Served' },
  { Icon: Award, value: '15+', label: 'Industry Certifications' },
  { Icon: CheckCircle, value: '100%', label: 'Job Placement Support' },
];

export default function EducationLandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleVoice = () => {
    const vo = voiceoverRef.current;
    if (!vo) return;
    if (!voiceActive) { vo.currentTime = 0; vo.play().catch(() => {}); setVoiceActive(true); }
    else { vo.pause(); setVoiceActive(false); }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/education" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Elevate for Humanity" width={140} height={40} className="h-9 w-auto" priority />
              <span className="hidden sm:inline text-xs font-bold text-brand-red-600 bg-brand-red-50 px-2.5 py-1 rounded-full border border-brand-red-200">Education</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map((n) => (
                <Link key={n.label} href={n.href} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-red-600 hover:bg-gray-50 rounded-lg transition-colors">{n.label}</Link>
              ))}
              <Link href="/start" className="ml-1 px-5 py-2.5 text-sm font-bold bg-brand-red-600 hover:bg-brand-red-700 text-white rounded-lg transition-colors">Apply Now</Link>
              <Link href="/login" className="ml-1 px-4 py-2.5 text-sm font-semibold text-brand-blue-600 border border-brand-blue-200 hover:bg-brand-blue-50 rounded-lg transition-colors">Sign In</Link>
            </nav>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Menu">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {mobileOpen && (
            <div className="lg:hidden border-t py-3 space-y-1">
              {NAV.map((n) => <Link key={n.label} href={n.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">{n.label}</Link>)}
              <Link href="/start" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-bold text-brand-red-600">Apply Now</Link>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-semibold text-brand-blue-600">Sign In</Link>
            </div>
          )}
        </div>
      </header>

      {/* VIDEO HERO — no overlay, text below video */}
      <section className="pt-16">
        <div className="relative w-full" style={{ aspectRatio: '16/7', minHeight: '360px' }}>
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" loop muted playsInline autoPlay preload="metadata" poster="/images/pages/workforce-training.jpg">
            <source src="/videos/career-services-hero.mp4" type="video/mp4" />
          </video>
          <audio ref={voiceoverRef} src="/audio/heroes/programs.mp3" preload="none" onEnded={() => setVoiceActive(false)} />
          <button onClick={toggleVoice} className={`absolute z-20 flex items-center gap-2 text-white rounded-full shadow-lg transition-all ${voiceActive ? 'bottom-4 right-4 px-4 py-2.5 bg-black/60 hover:bg-black/80' : 'bottom-6 right-6 px-5 py-3 bg-brand-red-600 hover:bg-brand-red-700 animate-pulse'}`} aria-label={voiceActive ? 'Stop narration' : 'Play narration'}>
            {voiceActive ? <><Volume2 className="w-5 h-5" /><span className="text-sm font-semibold hidden sm:inline">Narration On</span></> : <><VolumeX className="w-5 h-5" /><span className="text-sm font-bold">Tap for Narration</span></>}
          </button>
        </div>
        <div className="bg-slate-900 py-10 md:py-14 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Heart className="w-4 h-4" /> Elevate for Humanity Education
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Career Training That Changes Lives</h1>
            <p className="text-base md:text-lg text-slate-300 mb-8 max-w-3xl mx-auto">No-cost career training for eligible participants. Choose your program, pick your location, and build a career in healthcare, skilled trades, technology, and more.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/programs" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-7 py-3.5 rounded-lg font-bold transition-colors">Browse All Programs <ArrowRight className="w-5 h-5" /></Link>
              <Link href="/start" className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 px-7 py-3.5 rounded-lg font-bold transition-colors">Apply Now</Link>
              <Link href="/funding" className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-7 py-3.5 rounded-lg font-semibold transition-colors">Check Funding</Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white py-8 border-b">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-center gap-3 justify-center">
              <s.Icon className="w-9 h-9 text-brand-red-600 flex-shrink-0" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Choose Your Career Path</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Industry-recognized certifications and hands-on training. Many programs are fully funded through WIOA and state workforce grants.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PROGRAMS.map((p) => (
              <div key={p.title} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100">
                <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                  <Image src={p.image} alt={`${p.title} training`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Image src={p.icon} alt={p.title} width={40} height={40} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                    <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{p.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.tags.map((t) => <span key={t} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{t}</span>)}
                  </div>
                  <Link href={p.href} className="block w-full text-center bg-brand-red-600 hover:bg-brand-red-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">
                    View Programs <ArrowRight className="w-4 h-4 inline ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Pick Your Location</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Training across five states. Select a location to see programs, schedules, and enrollment near you.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LOCATIONS.map((loc) => (
              <div key={loc.state} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
                <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                  <Image src={loc.image} alt={`Training in ${loc.state}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-brand-red-500" />
                    <h3 className="text-lg font-bold text-gray-900">{loc.state}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{loc.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {loc.cities.map((c) => <span key={c} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{c}</span>)}
                  </div>
                  <Link href={loc.href} className="block w-full text-center bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">
                    Explore {loc.state} <ArrowRight className="w-4 h-4 inline ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDING CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Clock className="w-4 h-4" /> Now Enrolling
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Training May Be Fully Funded</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">Many programs are available at no cost through WIOA, state workforce grants, DOL Registered Apprenticeships, and other funding. Self-pay options also available.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/funding" className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-7 py-3.5 rounded-lg font-bold transition-colors">Check Funding Eligibility</Link>
            <Link href="/start" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-7 py-3.5 rounded-lg font-bold transition-colors">Start Your Application</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-gray-400 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <Image src="/logo.png" alt="Elevate for Humanity" width={120} height={36} className="h-8 w-auto brightness-0 invert mb-3" />
              <div className="text-sm">8888 Keystone Crossing, Suite 1300</div>
              <div className="text-sm">Indianapolis, IN 46240</div>
              <div className="flex items-center gap-2 mt-3 text-sm"><Phone className="w-4 h-4" /><a href="tel:+13173550500" className="hover:text-white">(317) 355-0500</a></div>
              <div className="flex items-center gap-2 mt-1 text-sm"><Mail className="w-4 h-4" /><a href="mailto:info@elevateforhumanity.org" className="hover:text-white">info@elevateforhumanity.org</a></div>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">Programs</div>
              <div className="space-y-2 text-sm">
                {PROGRAMS.map((p) => <Link key={p.title} href={p.href} className="block hover:text-white">{p.title}</Link>)}
              </div>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">Quick Links</div>
              <div className="space-y-2 text-sm">
                <Link href="/start" className="block hover:text-white">Apply Now</Link>
                <Link href="/funding" className="block hover:text-white">Funding & Financial Aid</Link>
                <Link href="/locations" className="block hover:text-white">Locations</Link>
                <Link href="/about" className="block hover:text-white">About Us</Link>
                <Link href="/contact" className="block hover:text-white">Contact</Link>
                <Link href="/privacy-policy" className="block hover:text-white">Privacy Policy</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
            <div>&copy; {new Date().getFullYear()} Elevate for Humanity. All rights reserved.</div>
            <Link href="https://www.elevateforhumanity.org" className="hover:text-white">www.elevateforhumanity.org</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
