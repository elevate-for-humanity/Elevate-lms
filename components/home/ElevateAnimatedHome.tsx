'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, DollarSign, Award, Users, CheckCircle, Play } from 'lucide-react';

// Video hero banner
const HOME_HERO = {
  video: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4',
  microLabel: 'DOL Registered Apprenticeship Sponsor',
  headline: 'Start Your Career Today',
  subheadline: 'Earn while you learn with paid apprenticeships in healthcare, trades, and beauty industries.',
  cta: { label: 'Apply Now', href: '/apply' },
  secondaryCta: { label: 'View Programs', href: '/programs' },
};

const PROGRAMS = [
  { 
    slug: 'barber-apprenticeship', 
    title: 'Barbering', 
    desc: 'Launch your career in professional barbering', 
    image: '/images/beauty/hero-program-barber.webp',
    price: 4980 
  },
  { 
    slug: 'cosmetology-apprenticeship', 
    title: 'Cosmetology', 
    desc: 'Master beauty techniques and styles', 
    image: '/images/beauty/esthetician.webp',
    price: 4980 
  },
  { 
    slug: 'hvac-technician', 
    title: 'HVAC/Refrigeration', 
    desc: 'Earn while you learn refrigeration', 
    image: '/images/pages/hvac-technician.webp',
    price: 4980 
  },
  { 
    slug: 'cna', 
    title: 'Healthcare', 
    desc: 'Start your healthcare career', 
    image: '/images/pages/cna-nursing-real.webp',
    price: 2500 
  },
];

const STATS = [
  { value: '94%', label: 'Completion Rate' },
  { value: '87%', label: 'Job Placement' },
  { value: '$28K', label: 'Avg. Starting Pay' },
  { value: '100%', label: 'Funding Support' },
];

const STEPS = [
  { 
    num: '01', 
    title: 'Apply', 
    desc: 'Complete a short application. No cost, no commitment.',
    image: '/images/pages/apply-page-1.jpg'
  },
  { 
    num: '02', 
    title: 'Funding Review', 
    desc: 'We check WIOA, Workforce Ready Grant, and other sources. Most qualify.',
    image: '/images/pages/funding-impact-1.webp'
  },
  { num: '03', title: 'Training', desc: 'Instructor-led, credential-aligned coursework with AI-powered support.', image: '/images/pages/comp-pathway-classroom.webp' },
  { num: '04', title: 'Apprenticeship', desc: 'DOL-registered OJT with employer partners. Hours tracked, wages paid.', image: '/images/pages/apprenticeships-page-1.webp' },
  { num: '05', title: 'Credential', desc: 'Industry-recognized certification. Publicly verifiable on our platform.', image: '/images/pages/certifications-page-1.webp' },
  { num: '06', title: 'Employment', desc: 'Job placement support, employer connections, and career advancement.', image: '/images/pages/employment-support-page-1.webp' },
];

const FUNDING = [
  { name: 'WIOA', desc: 'Federal funding for eligible job seekers. Covers tuition, books, and exam fees.', amount: 'Up to 100% covered' },
  { name: 'Workforce Ready Grant', desc: 'State grant for high-demand credentials. No repayment required.', amount: 'Free training' },
  { name: 'Job Ready Indy', desc: 'Local funding for Indianapolis-area residents in priority sectors.', amount: 'Multiple options' },
  { name: 'OJT Reimbursement', desc: 'Employers receive up to 50% wage reimbursement during apprenticeship.', amount: '50% wages' },
];

const CAREER_PATHWAYS = [
  { 
    slug: 'healthcare', 
    title: 'Healthcare', 
    salary: '$35K - $55K',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop',
    color: 'from-blue-600 to-blue-800'
  },
  { 
    slug: 'trades', 
    title: 'Skilled Trades', 
    salary: '$45K - $75K',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=400&fit=crop',
    color: 'from-orange-600 to-orange-800'
  },
  { 
    slug: 'beauty', 
    title: 'Beauty & Wellness', 
    salary: '$30K - $60K',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop',
    color: 'from-pink-600 to-pink-800'
  },
  { 
    slug: 'technology', 
    title: 'Technology', 
    salary: '$50K - $90K',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop',
    color: 'from-indigo-600 to-indigo-800'
  },
];

const BNPL_WEEKS = 29;

function BNPLCalculator({ tuition }: { tuition: number }) {
  const [deposit, setDeposit] = useState(500);
  const minDeposit = 0;
  const remaining = Math.max(0, tuition - deposit);
  const weekly = Math.ceil(remaining / BNPL_WEEKS);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <h4 className="text-lg font-bold text-[#0f172a] mb-4">Calculate Your Payment Plan</h4>
      
      <div className="mb-4">
        <label className="block text-sm text-slate-600 mb-2">Your Deposit (any amount, no minimum)</label>
        <input
          type="range"
          min={minDeposit}
          max={tuition}
          step={50}
          value={deposit}
          onChange={(e) => setDeposit(Number(e.target.value))}
          className="w-full accent-[#dc2626]"
        />
        <div className="flex justify-between text-sm text-slate-500 mt-1">
          <span>$0</span>
          <span className="font-bold text-[#dc2626]">${deposit}</span>
          <span>${tuition}</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
          <span className="text-slate-600">Program Total</span>
          <span className="font-bold text-[#0f172a]">${tuition.toLocaleString()}</span>
        </div>
        <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
          <span className="text-slate-600">Your Deposit</span>
          <span className="font-bold text-[#dc2626]">-${deposit}</span>
        </div>
        <div className="flex justify-between p-3 bg-[#0f172a] rounded-lg text-white">
          <span>Balance</span>
          <span className="font-bold">${remaining.toLocaleString()}</span>
        </div>
      </div>

      <div className="text-center p-4 bg-gradient-to-r from-[#dc2626] to-[#ea580c] rounded-xl">
        <span className="text-white/80 text-sm">Pay over {BNPL_WEEKS} weekly payments of</span>
        <div className="text-3xl font-bold text-white">${weekly}/week</div>
      </div>

      <p className="text-xs text-slate-500 mt-4 text-center">
        *0% interest. No credit check. Cancel anytime.
      </p>
    </div>
  );
}

export default function ElevateAnimatedHome() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(PROGRAMS[0]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0f172a] shadow-xl py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#dc2626] rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg">E</div>
            <span className="text-white font-bold text-lg">Elevate <span className="text-[#dc2626] font-light">for Humanity</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/programs" className="text-white/80 hover:text-white transition">Programs</Link>
            <Link href="/host-shop" className="text-white/80 hover:text-white transition">Host Shops</Link>
            <Link href="/funding" className="text-white/80 hover:text-white transition">Funding</Link>
            <Link href="/about" className="text-white/80 hover:text-white transition">About</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-white/80 hover:text-white transition hidden sm:block">Sign In</Link>
            <Link href="/programs/barber-apprenticeship/apply" className="px-6 py-2.5 bg-[#dc2626] text-white rounded-lg font-semibold hover:bg-[#b91c1c] transition shadow-lg">
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with Video */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={HOME_HERO.video} type="video/mp4" />
        </video>
        

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6 py-32">
          <motion.span 
            className="inline-block px-5 py-2 bg-[#dc2626]/20 border border-[#dc2626]/40 rounded-full text-[#dc2626] text-sm font-medium mb-8" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            {HOME_HERO.microLabel}
          </motion.span>

          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-white mb-6" 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
          >
            {HOME_HERO.headline}
            <span className="block text-[#dc2626]">Today</span>
          </motion.h1>

          <motion.p 
            className="text-xl text-white/80 mb-10 max-w-2xl mx-auto" 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
          >
            {HOME_HERO.subheadline}
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center" 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.6 }}
          >
            <Link href={HOME_HERO.cta.href} className="px-10 py-4 bg-[#dc2626] text-white rounded-lg font-bold hover:bg-[#b91c1c] transition shadow-xl flex items-center justify-center gap-2">
              {HOME_HERO.cta.label} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href={HOME_HERO.secondaryCta.href} className="px-10 py-4 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20 transition border border-white/20 flex items-center justify-center gap-2">
              {HOME_HERO.secondaryCta.label}
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2" 
          animate={{ y: [0, 10, 0] }} 
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full pt-2">
            <motion.div 
              className="w-1.5 h-3 bg-[#dc2626] rounded-full mx-auto" 
              animate={{ y: [0, 15, 0], opacity: [1, 0, 1] }} 
              transition={{ duration: 2, repeat: Infinity }} 
            />
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <motion.div key={i} className="text-center p-8 bg-[#0f172a] rounded-2xl" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="text-4xl font-bold text-[#dc2626] mb-2">{stat.value}</div>
                <div className="text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs with Pricing */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-[#0f172a] text-center mb-4">Our Programs</h2>
          <p className="text-slate-600 text-center mb-12">Choose your path to a new career</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {PROGRAMS.map((p, i) => (
              <motion.div key={p.slug} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <button onClick={() => setSelectedProgram(p)} className={`w-full text-left bg-white rounded-2xl overflow-hidden border-2 transition-all ${selectedProgram.slug === p.slug ? 'border-[#dc2626] shadow-xl' : 'border-slate-200 hover:border-[#dc2626]/50'}`}>
                  <div className="relative h-40 overflow-hidden">
                    <Image src={p.image} alt={p.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t to-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="text-white font-bold text-lg">{p.title}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-slate-600 text-sm mb-3">{p.desc}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#dc2626]">${p.price.toLocaleString()}</span>
                      <span className="text-xs text-slate-500">tuition</span>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-[#0f172a] text-center mb-4">How It Works</h2>
          <p className="text-slate-600 text-center mb-12">Your path to a new career in 6 simple steps</p>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.slice(0, 6).map((step, i) => (
              <motion.div key={i} className="relative" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                  <Image src={step.image} alt={step.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t to-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="w-10 h-10 bg-[#dc2626] rounded-full flex items-center justify-center text-white font-bold">{step.num}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BNPL Calculator + Funding */}
      <section className="py-24 bg-[#0f172a]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white text-center mb-4">Flexible Payment Options</h2>
          <p className="text-white/70 text-center mb-12">We make it affordable to start your career</p>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {/* BNPL Calculator */}
            <BNPLCalculator tuition={selectedProgram.price} />
            
            {/* Funding Options */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Funding & Assistance</h3>
              <p className="text-white/70 mb-6">Most students get trained at little to no cost through workforce funding programs.</p>
              
              <div className="space-y-4 mb-8">
                {FUNDING.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#dc2626] rounded-lg flex items-center justify-center text-white font-bold text-sm">{f.name}</div>
                      <div>
                        <div className="text-white font-semibold">{f.desc}</div>
                        <div className="text-[#dc2626] text-sm">{f.amount}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link href="/funding" className="inline-block px-8 py-4 bg-[#dc2626] text-white rounded-lg font-bold hover:bg-[#b91c1c] transition shadow-xl">
                Check Your Eligibility →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-[#0f172a] text-center mb-4">What&apos;s Included</h2>
          <p className="text-slate-600 text-center mb-12">Everything you need to start your career</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Paid Apprenticeship', desc: 'Earn wages while you learn on the job at approved host locations' },
              { title: 'RTI Classroom Hours', desc: 'Structured classroom instruction to pass your licensing exam' },
              { title: 'Exam Preparation', desc: 'Comprehensive prep for your state licensing exam' },
              { title: 'Job Placement Support', desc: 'Career services to help you find employment after graduation' },
              { title: 'Industry Connections', desc: 'Network with employers through our partner relationships' },
              { title: 'Continuing Education', desc: 'Access to advanced certifications and specialization' },
            ].map((item, i) => (
              <motion.div key={i} className="bg-white rounded-2xl p-8 border border-slate-200" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="w-12 h-12 bg-[#dc2626]/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-[#dc2626] to-[#ea580c]">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-white/90 text-xl mb-6">Apply today — it&apos;s free to apply. Funding may cover your entire program.</p>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-6 mb-10 inline-block">
            <div className="text-white/80 text-sm mb-1">Program Tuition</div>
            <div className="text-4xl font-bold text-white">${selectedProgram.price.toLocaleString()}</div>
            <div className="text-white/80 text-sm">or pay weekly with BNPL</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/programs/barber-apprenticeship/apply" className="px-12 py-5 bg-white text-[#dc2626] rounded-lg font-bold hover:bg-slate-100 transition shadow-xl">Apply Now — Free</Link>
            <Link href="/funding" className="px-12 py-5 bg-transparent border-2 border-white text-white rounded-lg font-bold hover:bg-white/10 transition">Check Funding</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#dc2626] rounded-lg flex items-center justify-center font-bold">E</div>
                <span className="font-bold">Elevate <span className="text-[#dc2626]">for Humanity</span></span>
              </div>
              <p className="text-slate-400 text-sm">DOL-registered apprenticeship sponsor and WIOA-approved training provider.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Programs</h4>
              <div className="space-y-2 text-slate-400"><Link href="/programs/barber-apprenticeship" className="block hover:text-white">Barbering</Link><Link href="/programs/cosmetology-apprenticeship" className="block hover:text-white">Cosmetology</Link><Link href="/programs" className="block hover:text-white">View All</Link></div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <div className="space-y-2 text-slate-400"><Link href="/funding" className="block hover:text-white">Funding</Link><Link href="/host-shop" className="block hover:text-white">Host Shops</Link><Link href="/about" className="block hover:text-white">About</Link></div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <p className="text-slate-400">6331 N Keystone Ave, Suite D<br />Indianapolis, IN 46220<br /><span className="text-[#dc2626]">(317) 314-3757</span></p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">© {new Date().getFullYear()} Elevate for Humanity. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
