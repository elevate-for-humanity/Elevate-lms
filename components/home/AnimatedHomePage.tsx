'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface Program {
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface Stat {
  value: string;
  label: string;
}

interface Campus {
  name: string;
  address: string;
  phone: string;
}

const PROGRAMS: Program[] = [
  { slug: 'barber-apprenticeship', title: 'Barbering', description: 'Launch your career in professional barbering', icon: '✂️', color: 'from-amber-500 to-orange-600' },
  { slug: 'cosmetology-apprenticeship', title: 'Cosmetology', description: 'Master beauty techniques and styles', icon: '💇', color: 'from-pink-500 to-rose-600' },
  { slug: 'hvac-technician', title: 'HVAC/Refrigeration', description: 'Earn while you learn refrigeration', icon: '❄️', color: 'from-cyan-500 to-blue-600' },
  { slug: 'cna-medication-aide', title: 'Healthcare', description: 'Start your healthcare career', icon: '🏥', color: 'from-emerald-500 to-teal-600' },
];

const STATS: Stat[] = [
  { value: '2,000+', label: 'Graduates Placed' },
  { value: '98%', label: 'License Pass Rate' },
  { value: '4', label: 'Campus Locations' },
  { value: '40+', label: 'Years Experience' },
];

const CAMPUSES: Campus[] = [
  { name: 'West Campus', address: '8888 Keystone Crossing, Indianapolis', phone: '(317) 314-3757' },
  { name: 'North Campus', address: '8900 N Meridian St, Carmel', phone: '(317) 555-0100' },
  { name: 'East Campus', address: '7500 E Washington St, Indianapolis', phone: '(317) 555-0200' },
  { name: 'South Campus', address: '6200 S Meridian St, Greenwood', phone: '(317) 555-0300' },
];

const FUNDING_OPTIONS = [
  { name: 'WIOA', description: 'Workforce Innovation & Opportunity Act' },
  { name: 'WRG', description: 'Workforce Ready Grant' },
  { name: 'JRI', description: 'Job Ready Indy' },
  { name: 'VA Benefits', description: 'GI Bill & Veterans Programs' },
];

export default function AnimatedHomePage() {
  const [currentProgram, setCurrentProgram] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProgram((prev) => (prev + 1) % PROGRAMS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-brand-red-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-40 right-10 w-96 h-96 bg-brand-blue-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-brand-gold-500/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-slate-900/95 backdrop-blur-lg shadow-2xl py-3' : 'bg-transparent py-6'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-red-500 to-brand-red-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg">Elevate</span>
              <span className="text-brand-red-400 font-light text-sm block -mt-1">for Humanity</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/programs" className="text-white/80 hover:text-white transition">Programs</Link>
            <Link href="/funding" className="text-white/80 hover:text-white transition">Funding</Link>
            <Link href="/about" className="text-white/80 hover:text-white transition">About</Link>
            <Link href="/contact" className="text-white/80 hover:text-white transition">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-white/80 hover:text-white transition hidden sm:block">Sign In</Link>
            <Link href="/programs/barber-apprenticeship/apply" className="px-6 py-2.5 bg-brand-red-600 text-white rounded-full font-semibold hover:bg-brand-red-700 transition shadow-lg shadow-brand-red-600/30">
              Apply Now
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        
        {/* Animated Geometric Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute border border-brand-red-500/20 rounded-full"
              style={{
                width: 200 + i * 150,
                height: 200 + i * 150,
                left: '50%',
                top: '50%',
                marginLeft: -(100 + i * 75),
                marginTop: -(100 + i * 75),
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 30 + i * 10, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>

        <motion.div 
          className="relative z-10 text-center px-6 max-w-5xl mx-auto"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block px-6 py-2 bg-brand-red-500/20 border border-brand-red-500/40 rounded-full text-brand-red-400 text-sm font-medium mb-8">
              DOL Registered Apprenticeship Sponsor
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Start Your Career
            <span className="block bg-gradient-to-r from-brand-red-400 via-brand-red-500 to-orange-500 bg-clip-text text-transparent">
              Today
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Earn while you learn with paid apprenticeships in healthcare, trades, and beauty industries. 
            Funding available — often at no cost to you.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link href="/programs/barber-apprenticeship/apply" className="group px-10 py-4 bg-brand-red-600 text-white rounded-full font-bold text-lg hover:bg-brand-red-700 transition shadow-2xl shadow-brand-red-600/40">
              <span className="flex items-center justify-center gap-2">
                Apply Now
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1, repeat: Infinity }}>→</motion.span>
              </span>
            </Link>
            <Link href="/programs" className="px-10 py-4 bg-white/10 backdrop-blur text-white rounded-full font-bold text-lg hover:bg-white/20 transition border border-white/20">
              Explore Programs
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-8 h-12 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <motion.div
              className="w-1.5 h-3 bg-brand-red-500 rounded-full"
              animate={{ y: [0, 20, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 bg-white" id="stats" data-animate>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                className="text-center p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                animate={visibleSections.has('stats') ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <motion.div
                  className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-red-600 to-orange-600 bg-clip-text text-transparent"
                  initial={{ scale: 0 }}
                  animate={visibleSections.has('stats') ? { scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1 + 0.3, type: 'spring' }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-slate-600 mt-2 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Carousel Section */}
      <section className="py-24 bg-slate-900" id="programs" data-animate>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={visibleSections.has('programs') ? { opacity: 1, y: 0 } : {}}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Programs</h2>
            <p className="text-slate-400 text-lg">Discover your path to a rewarding career</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROGRAMS.map((program, i) => (
              <motion.div
                key={program.slug}
                initial={{ opacity: 0, y: 40 }}
                animate={visibleSections.has('programs') ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                <Link href={`/programs/${program.slug}`} className="group block h-full">
                  <div className="relative h-full bg-slate-800 rounded-2xl p-8 border border-slate-700 hover:border-brand-red-500/50 transition-all duration-300 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${program.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${program.color} flex items-center justify-center text-3xl mb-6 shadow-lg`}>
                      {program.icon}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-brand-red-400 transition-colors">
                      {program.title}
                    </h3>
                    <p className="text-slate-400 mb-6">{program.description}</p>
                    
                    <div className="flex items-center text-brand-red-400 font-semibold group-hover:gap-3 transition-all">
                      Learn More <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white" id="how-it-works" data-animate>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={visibleSections.has('how-it-works') ? { opacity: 1, y: 0 } : {}}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-600 text-lg">Your path to a new career in 3 simple steps</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Apply Online', desc: 'Submit your application in minutes. Our team will guide you through funding options.', color: 'from-blue-500 to-cyan-500' },
              { step: '02', title: 'Campus Visit', desc: 'Schedule a visit to meet our instructors and explore your career path.', color: 'from-emerald-500 to-teal-500' },
              { step: '03', title: 'Start Learning', desc: 'Begin your paid apprenticeship and work toward your professional license.', color: 'from-orange-500 to-amber-500' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="relative"
                initial={{ opacity: 0, y: 40 }}
                animate={visibleSections.has('how-it-works') ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.2 }}
              >
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-lg`}>
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-4xl text-slate-300">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" id="funding" data-animate>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={visibleSections.has('funding') ? { opacity: 1, x: 0 } : {}}
            >
              <span className="inline-block px-4 py-1.5 bg-brand-red-500/20 border border-brand-red-500/40 rounded-full text-brand-red-400 text-sm font-medium mb-6">
                Financial Assistance Available
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Funding Shouldn&apos;t Be a Barrier
              </h2>
              <p className="text-slate-300 text-lg mb-8">
                We understand that investing in your education is a big decision. That&apos;s why we work with multiple funding sources to help you get trained — often at little to no cost.
              </p>
              <div className="space-y-4">
                {FUNDING_OPTIONS.map((option, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={visibleSections.has('funding') ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="w-12 h-12 bg-brand-red-500/20 rounded-full flex items-center justify-center">
                      <span className="text-brand-red-400 font-bold">{option.name}</span>
                    </div>
                    <span className="text-white">{option.description}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 40 }}
              animate={visibleSections.has('funding') ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-gradient-to-br from-brand-red-600 to-orange-600 rounded-3xl p-10 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">Start Your FAFSA</h3>
                <p className="text-white/90 mb-6">
                  Complete your FAFSA as soon as possible — financial aid is distributed on a first-come, first-served basis.
                </p>
                <div className="bg-white/20 backdrop-blur rounded-xl p-6 mb-6">
                  <span className="text-white/80 text-sm">School Code</span>
                  <div className="text-3xl font-bold text-white">04256200</div>
                </div>
                <Link href="/funding" className="block w-full py-4 bg-white text-brand-red-600 rounded-full font-bold text-center hover:bg-slate-100 transition">
                  Learn About Funding →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Campuses Section */}
      <section className="py-24 bg-slate-50" id="campuses" data-animate>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={visibleSections.has('campuses') ? { opacity: 1, y: 0 } : {}}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Our Campuses</h2>
            <p className="text-slate-600 text-lg">Serving Indiana with 4 convenient locations</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CAMPUSES.map((campus, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                animate={visibleSections.has('campuses') ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="w-12 h-12 bg-brand-red-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-brand-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{campus.name}</h3>
                <p className="text-slate-600 text-sm mb-3">{campus.address}</p>
                <a href={`tel:${campus.phone.replace(/\D/g, '')}`} className="text-brand-red-600 font-semibold text-sm hover:text-brand-red-700">
                  {campus.phone}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-brand-red-600 via-brand-red-500 to-orange-500 relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, 20],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to Start Your Journey?
          </motion.h2>
          <motion.p
            className="text-white/90 text-xl mb-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Join thousands of graduates who have launched successful careers through our programs.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/programs/barber-apprenticeship/apply" className="px-12 py-5 bg-white text-brand-red-600 rounded-full font-bold text-lg hover:bg-slate-100 transition shadow-xl">
              Apply Now — It&apos;s Free
            </Link>
            <Link href="/contact" className="px-12 py-5 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white/10 transition">
              Request Information
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-red-500 to-brand-red-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <div>
                  <span className="font-bold">Elevate</span>
                  <span className="text-brand-red-400 font-light text-sm block -mt-1">for Humanity</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm">DOL-registered apprenticeship sponsor and WIOA-approved training provider.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Programs</h4>
              <div className="space-y-2 text-slate-400">
                <Link href="/programs/barber-apprenticeship" className="block hover:text-white transition">Barbering</Link>
                <Link href="/programs/cosmetology-apprenticeship" className="block hover:text-white transition">Cosmetology</Link>
                <Link href="/programs/hvac-technician" className="block hover:text-white transition">HVAC</Link>
                <Link href="/programs" className="block hover:text-white transition">View All →</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <div className="space-y-2 text-slate-400">
                <Link href="/funding" className="block hover:text-white transition">Funding Options</Link>
                <Link href="/about" className="block hover:text-white transition">About Us</Link>
                <Link href="/contact" className="block hover:text-white transition">Contact</Link>
                <Link href="/faq" className="block hover:text-white transition">FAQ</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <div className="space-y-2 text-slate-400">
                <p>8888 Keystone Crossing, Suite 1300</p>
                <p>Indianapolis, IN 46240</p>
                <p className="text-brand-red-400">(317) 314-3757</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} Elevate for Humanity. All rights reserved.
          </div>
        </div>
      </footer>

      <style jsx>{`
        .bg-brand-red-500 { background-color: #dc2626; }
        .bg-brand-red-600 { background-color: #b91c1c; }
        .bg-brand-red-700 { background-color: #991b1b; }
        .text-brand-red-400 { color: #f87171; }
        .text-brand-red-500 { color: #ef4444; }
        .text-brand-red-600 { color: #dc2626; }
        .bg-brand-red-100 { background-color: #fef2f2; }
        .border-brand-red-500 { border-color: #ef4444; }
        .border-brand-red-600 { border-color: #dc2626; }
        .from-brand-red-500 { --tw-gradient-from: #ef4444; }
        .to-brand-red-600 { --tw-gradient-to: #dc2626; }
        .to-brand-red-700 { --tw-gradient-to: #991b1b; }
        .from-brand-red-600 { --tw-gradient-from: #dc2626; }
        .to-orange-500 { --tw-gradient-to: #f97316; }
        .to-orange-600 { --tw-gradient-to: #ea580c; }
        .hover\\:text-brand-red-400:hover { color: #f87171; }
        .hover\\:text-brand-red-700:hover { color: #991b1b; }
        .shadow-brand-red-600\\/30 { box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.3); }
        .shadow-brand-red-600\\/40 { box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.4); }
        .shadow-brand-red-500\\/20 { box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.2); }
        .shadow-brand-red-500\\/40 { box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.4); }
      `}</style>
    </div>
  );
}