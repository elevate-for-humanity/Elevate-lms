'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Hero video rotation
const HERO_VIDEOS = [
  {
    src: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/hvac-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/hvac-hero.webp',
    headline: 'Skilled Trades',
    sub: 'HVAC • Electrical • Welding',
  },
  {
    src: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/cdl-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cdl-hero.webp',
    headline: 'Commercial Driving',
    sub: 'CDL Class A & B • Career Placement',
  },
  {
    src: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/barber-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/barber-hero.webp',
    headline: 'Barber & Beauty',
    sub: 'Registered Apprenticeships • State Licensing',
  },
  {
    src: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/healthcare-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/healthcare-hero.webp',
    headline: 'Healthcare Careers',
    sub: 'Medical Assistant • CNA • Phlebotomy',
  },
  {
    src: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/business-hero.mp4',
    poster: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/business-hero.webp',
    headline: 'Business & Tech',
    sub: 'Entrepreneurship • Administration',
  },
];

// Trust badges
const TRUST_BADGES = [
  { src: '/images/partners/usdol.webp', alt: 'U.S. Department of Labor Registered Apprenticeship Sponsor' },
  { src: '/images/partners/dwd.webp', alt: 'Indiana Eligible Training Provider' },
  { src: '/images/pages/testing-center-hero.webp', alt: 'Authorized Testing Center' },
  { src: '/images/career-services-hero.webp', alt: 'Career Placement Services' },
  { src: '/images/employers/employers-group.webp', alt: 'Employer Partnerships' },
  { src: '/images/pages/online-learning.webp', alt: 'Flexible Online • Hybrid • Hands-On' },
];

// Career pathway sections
const CAREER_PATHWAYS = [
  {
    id: 'skilled-trades',
    headline: 'Skilled Trades',
    subheadline: 'Build a Rewarding Career in the Trades',
    description: 'From HVAC to electrical work, our skilled trades programs prepare you for in-demand careers with competitive wages and job security.',
    image: '/images/trades/trades-hands-on.webp',
    imageAlt: 'HVAC technician repairing commercial equipment',
    programs: ['HVAC Technician', 'Building Maintenance', 'Facilities Technician', 'Construction', 'Skilled Trades'],
    href: '/programs?category=skilled-trades',
    accent: 'from-amber-600 to-orange-600',
  },
  {
    id: 'cdl',
    headline: 'Commercial Driving',
    subheadline: 'Hit the Road to a New Career',
    description: 'Get your CDL and join one of the fastest-growing industries. Our programs include behind-the-wheel training and job placement support.',
    image: '/images/transportation/cdl-truck.webp',
    imageAlt: 'Professional CDL driver with tractor-trailer',
    programs: ['CDL Class A', 'CDL Class B', 'Passenger', 'Hazmat Preparation', 'Career Placement'],
    href: '/programs/cdl-training',
    accent: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'healthcare',
    headline: 'Healthcare Careers',
    subheadline: 'Make a Difference in Patient Care',
    description: 'Launch your healthcare career with certifications that employers trust. Work in hospitals, clinics, and healthcare facilities.',
    image: '/images/healthcare/ma-hero.webp',
    imageAlt: 'Medical Assistant assisting patient',
    programs: ['Medical Assistant', 'Phlebotomy', 'EKG Technician', 'Pharmacy Tech', 'CPR & First Aid', 'Home Health Aide', 'QMA', 'Behavioral Health', 'Peer Recovery'],
    href: '/programs?category=healthcare',
    accent: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'beauty',
    headline: 'Barber & Beauty',
    subheadline: 'Turn Your Passion Into a Career',
    description: 'Our DOL-registered apprenticeship programs let you earn while you learn. Get your license and build your own business.',
    image: '/images/beauty/barber-student.webp',
    imageAlt: 'Apprentice barber completing professional haircut',
    programs: ['Barber Apprenticeship', 'Cosmetology', 'Manicurist', 'Esthetics', 'Business for Beauty'],
    href: '/programs/barber-apprenticeship',
    accent: 'from-pink-600 to-rose-600',
  },
  {
    id: 'business',
    headline: 'Business & Entrepreneurship',
    subheadline: 'Build Your Business Future',
    description: 'Develop the skills to start and grow a successful business, or advance in corporate roles with our business programs.',
    image: '/images/business/business-training.webp',
    imageAlt: 'Students in modern business classroom',
    programs: ['Entrepreneurship', 'Business Start-Up', 'Bookkeeping', 'Office Administration', 'Customer Service', 'Digital Marketing', 'Leadership', 'AI Productivity'],
    href: '/programs?category=business',
    accent: 'from-purple-600 to-indigo-600',
  },
  {
    id: 'financial',
    headline: 'Financial Literacy & Wealth Building',
    subheadline: 'Build Wealth for Life',
    description: 'Learn the financial skills that create lasting prosperity. From budgeting to investing, we cover what schools don\'t teach.',
    image: '/images/financial/financial-workshop.webp',
    imageAlt: 'Financial literacy workshop',
    programs: ['Budgeting', 'Credit Building', 'Banking Basics', 'Homeownership Prep', 'Small Business Finance', 'Investing Fundamentals', 'Tax Preparation'],
    href: '/programs?category=financial-literacy',
    accent: 'from-emerald-600 to-green-600',
  },
];

// Funding options
const FUNDING_OPTIONS = [
  { src: '/images/funding/wioa-logo.webp', label: 'WIOA' },
  { src: '/images/funding/workforce-ready.webp', label: 'Workforce Ready Grant' },
  { src: '/images/funding/voc-rehab.webp', label: 'Vocational Rehabilitation' },
  { src: '/images/funding/employer-tuition.webp', label: 'Employer Tuition' },
  { src: '/images/funding/grants.webp', label: 'Grants' },
  { src: '/images/funding/veterans.webp', label: 'Veterans Benefits' },
  { src: '/images/funding/bnpl.webp', label: 'Buy Now, Pay Later' },
  { src: '/images/funding/payment-plan.webp', label: 'Payment Plans' },
];

// Why students choose
const WHY_STUDENT_POINTS = [
  { img: '/images/career-coaching-new.webp', alt: 'Career coaching', title: 'Career Coaching' },
  { img: '/images/resume-workshop.webp', alt: 'Resume development', title: 'Resume Development' },
  { img: '/images/interview-prep.webp', alt: 'Interview prep', title: 'Interview Preparation' },
  { img: '/images/industry-cert.webp', alt: 'Industry certification', title: 'Industry Certifications' },
  { img: '/images/digital-binder.webp', alt: 'Digital binder', title: 'Digital Student Binder' },
  { img: '/images/job-placement.webp', alt: 'Job placement', title: 'Job Placement' },
  { img: '/images/employer-networking.webp', alt: 'Employer networking', title: 'Employer Networking' },
  { img: '/images/alumni-support.webp', alt: 'Alumni support', title: 'Lifetime Alumni Support' },
];

// Success stories
const SUCCESS_STORIES = [
  { img: '/images/testimonials/graduate-1.webp', name: 'James R.', program: 'Barber Apprenticeship', story: 'From incarceration to owning my own barbershop. Elevate gave me structure and a real pathway.' },
  { img: '/images/testimonials/graduate-2.webp', name: 'Maria S.', program: 'Medical Assistant', story: 'Single mom thought school wasn\'t possible. Elevate helped me get funded and step into a real career.' },
  { img: '/images/testimonials/graduate-3.webp', name: 'David L.', program: 'HVAC Technician', story: 'The apprenticeship model let me earn while I learned. Now I\'m making $65K+ with room to grow.' },
];

// Animated counter hook
function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return <span>{count.toLocaleString()}</span>;
}

// Hero Section with rotating video
function HeroSection() {
  const [currentVideo, setCurrentVideo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % HERO_VIDEOS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-900">
      {/* Video Background */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVideo}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <video
              key={currentVideo}
              autoPlay
              muted
              loop
              playsInline
              poster={HERO_VIDEOS[currentVideo].poster}
              className="w-full h-full object-cover"
            >
              <source src={HERO_VIDEOS[currentVideo].src} type="video/mp4" />
            </video>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/50" />
      </div>

      {/* Video indicator dots */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {HERO_VIDEOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentVideo(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === currentVideo ? 'bg-brand-gold-400 w-6' : 'bg-white/40 hover:bg-white/60'}`}
            aria-label={`Switch to video ${i + 1}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-32">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1 bg-brand-red-600 text-white text-sm font-bold rounded-full mb-6">
              {HERO_VIDEOS[currentVideo].headline}
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              America's Workforce<br />Starts Here.
            </h1>
            
            <p className="text-xl md:text-2xl font-bold text-brand-gold-400 mb-6">
              Train. Get Certified. Get Hired.
            </p>
            
            <p className="text-lg text-white/90 mb-8 leading-relaxed max-w-2xl">
              Whether you're beginning your first career, changing professions, earning industry-recognized 
              certifications, or becoming a registered apprentice, {PLATFORM_DEFAULTS.orgName} provides the 
              education, hands-on training, and career support needed to build a better future.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/programs"
                className="px-8 py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-lg text-lg transition-colors text-center"
              >
                Explore Programs
              </Link>
              <Link
                href="/check-eligibility"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/30 transition-colors text-center"
              >
                Check Funding Eligibility
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-900 font-bold rounded-lg text-lg transition-colors text-center"
              >
                Schedule an Advisor
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2" />
        </div>
      </motion.div>
    </section>
  );
}

// Trust Bar
function TrustBar() {
  return (
    <section className="bg-slate-50 border-b border-slate-200 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
          Trusted by Students, Employers & Government Partners
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {TRUST_BADGES.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="relative w-14 h-14 mb-2">
                <Image
                  src={badge.src}
                  alt={badge.alt}
                  fill
                  className="object-contain"
                  sizes="56px"
                />
              </div>
              <p className="text-[10px] text-slate-600 text-center leading-tight">{badge.alt}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Career Pathway Section
function CareerPathwaySection({ pathway, index }: { pathway: typeof CAREER_PATHWAYS[0]; index: number }) {
  const isEven = index % 2 === 0;
  
  return (
    <section className={`py-16 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className={`grid lg:grid-cols-2 gap-12 items-center ${isEven ? '' : 'lg:flex-row-reverse'}`}>
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: isEven ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`relative rounded-2xl overflow-hidden ${isEven ? '' : 'lg:order-2'}`}
          >
            <Image
              src={pathway.image}
              alt={pathway.imageAlt}
              width={600}
              height={400}
              className="w-full h-80 object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent`} />
            <div className={`absolute bottom-4 left-4 bg-gradient-to-r ${pathway.accent} px-4 py-2 rounded-full`}>
              <span className="text-white font-bold text-sm">{pathway.headline}</span>
            </div>
          </motion.div>
          
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: isEven ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={isEven ? '' : 'lg:order-1'}
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
              {pathway.subheadline}
            </h2>
            <p className="text-lg text-slate-700 mb-6">{pathway.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {pathway.programs.slice(0, 5).map((program) => (
                <span
                  key={program}
                  className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full"
                >
                  {program}
                </span>
              ))}
              {pathway.programs.length > 5 && (
                <span className="text-sm text-brand-red-600 font-semibold">
                  +{pathway.programs.length - 5} more
                </span>
              )}
            </div>
            
            <Link
              href={pathway.href}
              className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${pathway.accent} text-white font-bold rounded-lg hover:opacity-90 transition-opacity`}
            >
              Explore {pathway.headline}
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Apprenticeship Section
function ApprenticeshipSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/apprenticeship-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-slate-900/80" />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-1 bg-brand-gold-500 text-slate-900 text-sm font-bold rounded-full mb-6">
            DOL Registered
          </span>
          
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Registered Apprenticeships
          </h2>
          
          <p className="text-2xl font-bold text-brand-gold-400 mb-8">
            Earn While You Learn.
          </p>
          
          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
            Registered Apprenticeships combine paid employment with structured classroom instruction, 
            allowing students to gain valuable work experience while earning industry-recognized credentials.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            {[
              { img: '/images/icons/paid-work.webp', title: 'Paid Work Experience' },
              { img: '/images/icons/credentials.webp', title: 'Industry Credentials' },
              { img: '/images/icons/mentorship.webp', title: 'Employer Mentorship' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="relative w-16 h-16 mb-4">
                  <Image src={item.img} alt={item.title} fill className="object-contain" />
                </div>
                <p className="font-bold">{item.title}</p>
              </div>
            ))}
          </div>
          
          <Link
            href="/apprenticeships"
            className="inline-flex items-center px-8 py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-lg text-lg transition-colors"
          >
            Learn About Apprenticeships
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Funding Section
function FundingSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative rounded-2xl overflow-hidden mb-8">
              <Image
                src="/images/students/student-advisor.webp"
                alt="Student meeting with advisor"
                width={600}
                height={400}
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 to-transparent flex items-end">
                <p className="text-white text-xl font-bold p-6">
                  Funding May Be Available<br />for Qualified Students
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Funding Your Education
            </h2>
            
            <p className="text-xl font-bold text-brand-gold-600 mb-6">
              Your Education May Cost Less Than You Think.
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-8">
              {FUNDING_OPTIONS.map((option, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="relative w-10 h-10 shrink-0">
                    <Image src={option.src} alt={option.label} fill className="object-contain" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{option.label}</span>
                </div>
              ))}
            </div>
            
            <Link
              href="/check-eligibility"
              className="inline-flex items-center px-8 py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-lg text-lg transition-colors"
            >
              Check My Eligibility
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Why Students Choose
function WhyStudentsChoose() {
  return (
    <section className="py-20 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Why Students Choose Elevate
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            More than classroom instruction. Real career support from enrollment to employment.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {WHY_STUDENT_POINTS.map((point, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden"
            >
              <div className="relative h-32">
                <Image src={point.img} alt={point.alt} fill className="object-cover" />
              </div>
              <div className="p-4 text-center">
                <p className="font-bold text-sm">{point.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Employer Section
function EmployerSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/employers/employer-hiring.webp"
          alt="Employer interviewing candidates"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/85" />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Employer Partnerships
            </h2>
            
            <p className="text-xl text-white/90 mb-6">
              We partner with employers to recruit talent, develop apprenticeship programs, 
              deliver customized workforce training, and help businesses build a stronger workforce.
            </p>
            
            <div className="space-y-3 mb-8">
              {[
                'Registered Apprenticeships',
                'Customized Training',
                'Employee Upskilling',
                'Candidate Recruitment',
                'Skills Assessments',
                'Industry Certifications',
              ].map((service, i) => (
                <div key={i} className="flex items-center gap-3 text-white">
                  <Image src="/images/icons/check-white.webp" alt="Check" width={20} height={20} className="object-contain" />
                  <span>{service}</span>
                </div>
              ))}
            </div>
            
            <Link
              href="/employers"
              className="inline-flex items-center px-8 py-4 bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-900 font-bold rounded-lg text-lg transition-colors"
            >
              Become an Employer Partner
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            {SUCCESS_STORIES.slice(0, 2).map((story, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden h-48">
                <Image src={story.img} alt={story.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end">
                  <div className="p-4">
                    <p className="text-white font-bold">{story.name}</p>
                    <p className="text-white/80 text-sm">{story.program}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Success Stories
function SuccessStories() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            Student Success Stories
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Every certification earned represents a life changed. Every graduate moves closer to financial independence.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {SUCCESS_STORIES.map((story, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
            >
              <div className="relative h-48">
                <Image src={story.img} alt={story.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end">
                  <div className="p-4">
                    <p className="text-white font-bold">{story.name}</p>
                    <p className="text-white/80 text-sm">{story.program}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-slate-700 italic">"{story.story}"</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Final CTA
function FinalCTA() {
  return (
    <section className="bg-gradient-to-br from-brand-red-700 to-brand-red-900 py-20">
      <div className="max-w-4xl mx-auto px-4 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Ready to Build Your Future?
          </h2>
          
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Whether you're pursuing a career in HVAC, CDL, Barbering, Healthcare, Business, or Financial Literacy, 
            {PLATFORM_DEFAULTS.orgName} provides the education, support, and career pathways to help you succeed.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/programs"
              className="px-8 py-4 bg-white text-brand-red-700 font-bold rounded-lg text-lg hover:bg-slate-100 transition-colors"
            >
              Explore Programs
            </Link>
            <Link
              href="/apply"
              className="px-8 py-4 bg-brand-gold-500 text-slate-900 font-bold rounded-lg text-lg hover:bg-brand-gold-600 transition-colors"
            >
              Apply Today
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg text-lg hover:bg-white/10 transition-colors"
            >
              Book an Appointment
            </Link>
            <Link
              href="/check-eligibility"
              className="px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg text-lg hover:bg-brand-blue-700 transition-colors"
            >
              Check Funding Eligibility
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Main export
export function PremiumHomePage() {
  return (
    <main>
      <HeroSection />
      <TrustBar />
      {CAREER_PATHWAYS.map((pathway, index) => (
        <CareerPathwaySection key={pathway.id} pathway={pathway} index={index} />
      ))}
      <ApprenticeshipSection />
      <FundingSection />
      <WhyStudentsChoose />
      <EmployerSection />
      <SuccessStories />
      <FinalCTA />
    </main>
  );
}

export default PremiumHomePage;

// Statistics for animated counter
const OUTCOME_STATS = [
  { value: 2000, suffix: '+', label: 'Graduates Placed' },
  { value: 98, suffix: '%', label: 'License Pass Rate' },
  { value: 4, label: 'Campus Locations' },
  { value: 50, suffix: '+', label: 'Employer Partners' },
];

const FUNDING_STATS = [
  { value: 100, suffix: '%', label: 'WIOA Funding Available' },
  { value: 0, label: 'Upfront Costs' },
  { value: 29, suffix: ' weeks', label: 'Flexible Payments' },
  { value: 0, label: 'Credit Check Required' },
];

// Hero with video background
function HeroSection() {
  const { ref, isVisible } = useScrollAnimation(0);
  
  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-900">
      {/* Video Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-red-900/30" />
        {/* Animated geometric shapes */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-red-600/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-blue-600/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 4 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-600/20 border border-brand-red-600/40 rounded-full text-brand-red-400 text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 bg-brand-red-500 rounded-full animate-pulse" />
          DOL Registered Apprenticeship Sponsor
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight"
        >
          From Unemployed to
          <span className="block text-brand-red-500">Employed</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-xl text-slate-300 max-w-2xl mx-auto mb-10"
        >
          Earn while you learn with paid apprenticeships in healthcare, skilled trades, and beauty industries. 
          Funding may cover your entire program.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
        >
          <Link
            href="/apply"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors shadow-lg shadow-brand-red-600/30"
          >
            Apply Now
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/schedule-consultation"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Schedule Free Consultation
          </Link>
          <Link
            href="/eligibility"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-brand-red-600 hover:bg-brand-red-600/10 transition-colors"
          >
            Check Eligibility
          </Link>
        </motion.div>

        {/* Trust Badges */}
        <TrustBadges variant="hero" />

        {/* AI Advisor Entry */}
        <AIAdvisorWidget variant="hero" />
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/50 text-sm"
        >
          Scroll to explore
        </motion.div>
      </motion.div>
    </section>
  );
}

// How It Works - Premium cards
function HowItWorksPreview() {
  const { ref, isVisible } = useScrollAnimation(0);
  
  const steps = [
    {
      num: '01',
      title: 'Apply Online',
      desc: 'Submit your application in minutes. Our team will guide you through funding options.',
      icon: <CheckCircle className="w-6 h-6" />,
    },
    {
      num: '02',
      title: 'Get Matched',
      desc: 'We match you with employers and find funding you qualify for.',
      icon: <Users className="w-6 h-6" />,
    },
    {
      num: '03',
      title: 'Start Earning',
      desc: 'Begin your paid apprenticeship and work toward your professional license.',
      icon: <Star className="w-6 h-6" />,
    },
  ];

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <span className="text-brand-red-600 font-bold text-sm uppercase tracking-widest">Simple Process</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-4">
            Start Your Career in 3 Steps
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            We've removed the barriers between you and your new career. Apply today and 
            see how quickly you can transform your future.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-brand-red-600 to-transparent z-0" />
              )}
              
              <div className="relative z-10 bg-slate-50 rounded-2xl p-8 text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-brand-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white">
                  {step.icon}
                </div>
                <span className="text-4xl font-extrabold text-brand-red-200 absolute top-4 right-4">
                  {step.num}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
          >
            Start Your Application
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Programs Preview
function PremiumPrograms() {
  const { ref, isVisible } = useScrollAnimation(0);
  
  const programs = [
    {
      title: 'Barbering',
      desc: 'Launch your career in professional barbering with paid apprenticeship.',
      duration: '52 weeks',
      credential: 'Indiana Barber License',
      salary: '$35,000-$55,000/yr',
      href: '/programs/barber-apprenticeship',
      color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'HVAC/R',
      desc: 'Earn while you learn refrigeration and heating systems.',
      duration: '48 weeks',
      credential: 'EPA 608 Certification',
      salary: '$45,000-$65,000/yr',
      href: '/programs/hvac-technician',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Healthcare',
      desc: 'Start your healthcare career as a CNA with medication aide training.',
      duration: '16 weeks',
      credential: 'CNA + Medication Aide',
      salary: '$30,000-$45,000/yr',
      href: '/programs/cna-medication-aide',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Commercial Trucking',
      desc: 'Get your CDL and start driving with paid training programs.',
      duration: '8 weeks',
      credential: 'CDL Class A',
      salary: '$50,000-$75,000/yr',
      href: '/programs/cdl-training',
      color: 'from-purple-500 to-indigo-600',
    },
  ];

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <span className="text-brand-red-600 font-bold text-sm uppercase tracking-widest">Career Pathways</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-4">
            Explore Our Programs
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            From beauty to healthcare to skilled trades, we have a program that fits your goals.
          </p>
        </motion.div>

        {/* Program Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((program, index) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={program.href}
                className="block group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full"
              >
                <div className={`h-3 bg-gradient-to-r ${program.color}`} />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-red-600 transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">{program.desc}</p>
                  
                  <div className="space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{program.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{program.credential}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span>{program.salary}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-brand-red-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-10"
        >
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:border-brand-red-600 hover:text-brand-red-600 transition-colors"
          >
            View All Programs
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Funding section
function FundingSection() {
  const { ref, isVisible } = useScrollAnimation(0);

  const fundingOptions = [
    { name: 'WIOA', desc: 'Workforce Innovation & Opportunity Act', coverage: 'Up to 100%' },
    { name: 'Workforce Ready', desc: 'Indiana Workforce Ready Grant', coverage: 'Free Training' },
    { name: 'FSSA IMPACT', desc: 'Health & Human Services Programs', coverage: 'Varies' },
    { name: 'VR Services', desc: 'Vocational Rehabilitation', coverage: 'Individualized' },
  ];

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
          >
            <span className="text-brand-red-400 font-bold text-sm uppercase tracking-widest">Affordable Education</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-6">
              Most Students Pay <span className="text-brand-red-500">$0</span>
            </h2>
            <p className="text-slate-300 text-lg mb-8">
              Through workforce funding programs, most of our students complete their training 
              at little to no cost. We help you find and apply for every funding option you qualify for.
            </p>
            
            <div className="space-y-4 mb-8">
              {fundingOptions.map((option) => (
                <div key={option.name} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-brand-red-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {option.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold">{option.name}</div>
                    <div className="text-slate-400 text-sm">{option.desc}</div>
                  </div>
                  <div className="text-brand-red-400 font-bold text-sm">{option.coverage}</div>
                </div>
              ))}
            </div>

            <Link
              href="/eligibility"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
            >
              Check Your Eligibility
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Right - Calculator preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6">Payment Calculator</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-slate-600 text-sm font-medium mb-2 block">Program Tuition</label>
                <div className="text-3xl font-extrabold text-slate-900">$4,980</div>
              </div>
              
              <div>
                <label className="text-slate-600 text-sm font-medium mb-2 block">Your Deposit</label>
                <input
                  type="range"
                  min="0"
                  max="4980"
                  step="50"
                  defaultValue="0"
                  className="w-full accent-brand-red-600"
                />
                <div className="flex justify-between text-sm text-slate-500">
                  <span>$0</span>
                  <span className="font-bold text-brand-red-600">$0</span>
                  <span>$4,980</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Balance</span>
                  <span className="font-bold text-slate-900">$4,980</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Weekly Payment (29 weeks)</span>
                  <span className="font-bold text-brand-red-600">$172/week</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                *0% interest. No credit check. Cancel anytime.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Success Stories
function SuccessStories() {
  const { ref, isVisible } = useScrollAnimation(0);
  
  const testimonials = [
    {
      name: 'Marcus T.',
      program: 'Barbering',
      quote: 'I went from unemployed to running my own barbershop in 18 months. The paid apprenticeship made all the difference.',
      salary: '$45,000 → $62,000',
      image: '/images/students/marcus-t.webp',
    },
    {
      name: 'Sarah M.',
      program: 'HVAC Technician',
      quote: 'The funding covered everything. I now work for a major commercial HVAC company with amazing benefits.',
      salary: '$28,000 → $58,000',
      image: '/images/students/sarah-m.webp',
    },
    {
      name: 'James R.',
      program: 'CDL Training',
      quote: 'They helped me get my CDL and connected me with a trucking company before I even finished the program.',
      salary: '$32,000 → $72,000',
      image: '/images/students/james-r.webp',
    },
  ];

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <span className="text-brand-red-600 font-bold text-sm uppercase tracking-widest">Graduate Success</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-4">
            Real Stories, Real Results
          </h2>
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.2 }}
              className="bg-slate-50 rounded-2xl p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              <p className="text-slate-700 mb-6 italic">"{testimonial.quote}"</p>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-red-100 rounded-full flex items-center justify-center">
                  <span className="text-brand-red-600 font-bold">
                    {testimonial.name.split(' ')[0].charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-slate-900">{testimonial.name}</div>
                  <div className="text-sm text-slate-500">{testimonial.program}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xs text-slate-500">Salary Increase</div>
                  <div className="text-brand-red-600 font-bold text-sm">{testimonial.salary}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Final CTA
function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-brand-red-600 to-brand-red-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of graduates who have launched successful careers through our 
            paid apprenticeship programs. Your journey starts with a single click.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-brand-red-600 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-lg"
            >
              Apply Now — It's Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white hover:bg-white/10 transition-colors"
            >
              <Phone className="w-5 h-5" />
              (317) 314-3757
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-10 text-white/80 text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> No upfront costs
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Free eligibility check
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Apply in 5 minutes
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Main export
export function PremiumHomePage() {
  return (
    <div className="min-h-screen">
      {/* 1. Hero - Premium Video Experience */}
      <HeroVideo />

      {/* 2. Trust Badges Strip */}
      <div className="bg-slate-50 border-y border-slate-200 py-4">
        <TrustBadges variant="section" />
      </div>

      {/* 3. How It Works */}
      <HowItWorksPreview />

      {/* 4. Career Pathways */}
      <CareerPathways />

      {/* 5. Animated Stats */}
      <AnimatedStats
        stats={OUTCOME_STATS}
        title="Proven Results"
        subtitle="Our graduates succeed because we invest in their futures"
        dark={false}
      />

      {/* 6. Trust Bar - Comprehensive */}
      <TrustBar variant="full" />

      {/* 7. Program Discovery Quiz */}
      <ProgramDiscovery />

      {/* 8. Premium Programs */}
      <PremiumPrograms />

      {/* 8. Salary Calculator */}
      <SalaryCalculator />

      {/* 9. ROI Calculator */}
      <ROICalculator />

      {/* 10. Funding Experience */}
      <FundingExperience />

      {/* 11. Success Stories Gallery */}
      <SuccessStoriesGallery />

      {/* 12. Employer & Partner Wall */}
      <EmployerPartnerWall />

      {/* 13. Visitor Questions - Answer Before They Ask */}
      <VisitorQuestions />

      {/* 14. Employer Partners - Logo Strip */}
      <AnimatedLogoStrip />
      <PartnerLogoStrip variant="dark" />

      {/* 15. Final CTA */}
      <FinalCTA />

      {/* 16. AI Advisor Floating Widget */}
      <AIAdvisorWidget variant="floating" />
    </div>
  );
}

export default PremiumHomePage;
