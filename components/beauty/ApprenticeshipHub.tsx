'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin, Phone, Star, DollarSign, Users, Award, CheckCircle,
  Shield, Heart, Zap, ArrowRight, Search, Sparkles, ThumbsUp,
  Calendar, CreditCard, Building2, Wrench, Scissors, Droplet,
  Flower2, Target, TrendingUp, GraduationCap, Clock, MessageCircle,
  Briefcase, Calculator, Percent
} from 'lucide-react';

// Payment Calculator Component
function PaymentCalculator() {
  const [program, setProgram] = useState('$4,980');
  const [deposit, setDeposit] = useState(600);
  const [weeks, setWeeks] = useState(52);
  
  const total = parseInt(program.replace(/[^0-9]/g, ''));
  const remaining = total - deposit;
  const weeklyPayment = (remaining / weeks).toFixed(2);
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">Payment Calculator</h3>
          <p className="text-sm text-gray-500">See your estimated weekly payments</p>
        </div>
      </div>
      
      {/* Program Select */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Select Program</label>
        <select 
          value={program} 
          onChange={(e) => setProgram(e.target.value)}
          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="$4,980">Barber Apprenticeship - $4,980</option>
          <option value="$4,980">Cosmetology Apprenticeship - $4,980</option>
          <option value="$4,980">Esthetician Apprenticeship - $4,980</option>
          <option value="$4,980">Nail Technician - $4,980</option>
        </select>
      </div>
      
      {/* Deposit Slider */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <label className="font-medium text-gray-700">Deposit Amount</label>
          <span className="font-bold text-amber-600">${deposit}</span>
        </div>
        <input 
          type="range" 
          min="600" 
          max="2500" 
          step="100"
          value={deposit}
          onChange={(e) => setDeposit(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>$600 min</span>
          <span>$2,500 max</span>
        </div>
      </div>
      
      {/* Results */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white">
        <div className="text-center mb-4">
          <p className="text-gray-400 text-sm">Program Total</p>
          <p className="text-3xl font-black text-amber-400">${total.toLocaleString()}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-gray-400 text-xs">Your Deposit</p>
            <p className="text-xl font-bold text-green-400">${deposit}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs">Balance</p>
            <p className="text-xl font-bold">${remaining.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-4 text-center">
          <p className="text-gray-400 text-sm mb-1">Your Weekly Payment</p>
          <p className="text-4xl font-black text-amber-400">${weeklyPayment}<span className="text-lg">/wk</span></p>
          <p className="text-xs text-gray-500 mt-1">Over {weeks} weeks</p>
        </div>
      </div>
      
      {/* BNPL Note */}
      <div className="mt-4 flex items-start gap-2 p-3 bg-green-50 rounded-xl">
        <Percent className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-green-700">
          <strong>Buy Now, Pay Later available!</strong> Split your payments across 12-52 weeks with 0% interest options. No credit check required.
        </p>
      </div>
    </div>
  );
}

// Packages Component
function Packages() {
  const packages = [
    {
      name: 'Essential Package',
      price: '$2,490',
      savings: '50% OFF',
      desc: 'RTI coursework only',
      features: ['Online instruction', 'Exam prep', 'Digital materials', 'Support access'],
      color: 'bg-gray-100',
      border: 'border-gray-200',
      badge: null
    },
    {
      name: 'Complete Package',
      price: '$4,980',
      savings: 'BEST VALUE',
      desc: 'RTI + Tools + Exam',
      features: ['Everything in Essential', 'Professional toolkit', 'State board fee', 'CPR certification', 'Career placement', '1-on-1 coaching'],
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
      border: 'border-amber-500',
      badge: '⭐ MOST POPULAR'
    },
    {
      name: 'Premium Package',
      price: '$6,980',
      savings: null,
      desc: 'Complete + extras',
      features: ['Everything in Complete', 'Advanced training', 'Business bootcamp', 'Marketing materials', 'Equipment upgrade', 'VIP mentorship'],
      color: 'bg-gray-900',
      border: 'border-gray-900',
      badge: null
    }
  ];
  
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {packages.map((pkg, idx) => (
        <div key={idx} className={`${pkg.color} ${pkg.border} border-4 rounded-2xl p-6 relative ${idx === 1 ? 'transform md:scale-105' : ''}`}>
          {pkg.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-black text-white px-4 py-1 text-xs font-bold rounded-full">
                {pkg.badge}
              </span>
            </div>
          )}
          {pkg.savings && (
            <div className="absolute -top-3 right-4">
              <span className="bg-red-500 text-white px-3 py-1 text-xs font-bold rounded-full animate-pulse">
                {pkg.savings}
              </span>
            </div>
          )}
          
          <h3 className={`text-xl font-black mb-2 ${idx === 2 ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</h3>
          <p className={`text-sm mb-4 ${idx === 2 ? 'text-gray-300' : 'text-gray-600'}`}>{pkg.desc}</p>
          
          <div className="mb-6">
            <span className={`text-4xl font-black ${idx === 1 ? 'text-white' : idx === 2 ? 'text-amber-400' : 'text-gray-900'}`}>{pkg.price}</span>
          </div>
          
          <ul className="space-y-2 mb-6">
            {pkg.features.map((feat, i) => (
              <li key={i} className={`flex items-center gap-2 text-sm ${idx === 2 ? 'text-gray-300' : 'text-gray-700'}`}>
                <CheckCircle className={`w-4 h-4 ${idx === 1 ? 'text-white' : 'text-green-500'}`} />
                {feat}
              </li>
            ))}
          </ul>
          
          <Link href="/apply" className={`block w-full text-center py-3 font-bold rounded-xl transition-all ${
            idx === 1 
              ? 'bg-white text-amber-600 hover:bg-gray-100' 
              : idx === 2 
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}>
            Get Started
          </Link>
        </div>
      ))}
    </div>
  );
}

// Pexels Videos
const PEXELS_VIDEOS = {
  barber: 'https://videos.pexels.com/video-files/7426300/7426300-hd_1366_576_50fps.mp4',
  beardTrim: 'https://videos.pexels.com/video-files/7697533/7697533-hd_1280_720_30fps.mp4',
  haircut: 'https://videos.pexels.com/video-files/9737935/9737935-hd_1280_720_24fps.mp4',
  nail: 'https://videos.pexels.com/video-files/7754856/7754856-hd_1280_720_30fps.mp4',
  spa: 'https://videos.pexels.com/video-files/4772528/4772528-hd_720_1280_24fps.mp4',
};

// Pexels Images
const PEXELS_IMAGES = {
  barber: 'https://images.pexels.com/photos/7697278/pexels-photo-7697278.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200',
  cosmetology: 'https://images.pexels.com/photos/5584459/pexels-photo-5584459.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200',
  esthetician: 'https://images.pexels.com/photos/5583976/pexels-photo-5583976.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200',
  nail: 'https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200',
  salon: 'https://images.pexels.com/photos/1123902/pexels-photo-1123902.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200',
  employer: 'https://images.pexels.com/photos/1819948/pexels-photo-1819948.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200',
};

const PROGRAM_ICONS: Record<string, React.ReactNode> = {
  barber: <Scissors className="w-6 h-6" />,
  cosmetology: <Sparkles className="w-6 h-6" />,
  esthetician: <Droplet className="w-6 h-6" />,
  nail: <Flower2 className="w-6 h-6" />,
};

// HOST_SHOPS loaded dynamically from database

const TESTIMONIALS = [
  { id: 1, name: 'Destiny Williams', role: 'Licensed Barber', image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200', quote: 'I went from BROKE to BANKABLE in just 12 months! This program gave me a career that pays my bills AND feeds my soul. Now I own my own shop!', rating: 5, location: 'Atlanta, GA', earnings: '$65K+ / year' },
  { id: 2, name: 'Marcus Thompson', role: 'Master Barber', image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200', quote: 'Corporate was killing me. Now I make MORE money cutting hair and I actually LOVE Mondays. Best career pivot EVER.', rating: 5, location: 'Los Angeles, CA', earnings: '$72K / year' },
  { id: 3, name: 'Ashley Rodriguez', role: 'Licensed Esthetician', image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200', quote: 'Single mom of 3, thought I was stuck. Now I work at a luxury spa and make more than I ever dreamed possible.', rating: 5, location: 'Miami, FL', earnings: '$58K+ / year' },
  { id: 4, name: 'Tyrone Jackson', role: 'Host Shop Owner', image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200', quote: 'My revenue DOUBLED since joining. Pre-trained apprentices, zero hiring headaches, WOTC credits. This is a NO-BRAINER.', rating: 5, location: 'Chicago, IL', revenue: '+120% Revenue' },
];

const PROGRAMS = [
  { slug: 'barber-apprenticeship', title: 'Barber Apprenticeship', hours: '2,000', price: '$4,980', duration: '12-18 mo', image: PEXELS_IMAGES.barber, video: PEXELS_VIDEOS.haircut, description: 'Master classic cuts, fades, beard styling, and hot shaves.', included: ['2,000 hours RTI', 'Online + hands-on training', 'License exam prep', 'State board fee included', 'Professional toolkit', 'CPR & Infection Control', 'Career placement', 'WIOA funding OK'], careers: ['Barber', 'Shop Owner', 'Groomer'], cta: 'Apply FREE Now', color: 'from-amber-500 to-orange-600', type: 'barber', hot: true },
  { slug: 'cosmetology-apprenticeship', title: 'Cosmetology Apprenticeship', hours: '2,000', price: '$4,980', duration: '12-18 mo', image: PEXELS_IMAGES.cosmetology, video: PEXELS_VIDEOS.beardTrim, description: 'Learn hair coloring, styling, cuts, and treatments.', included: ['2,000 hours RTI', 'Online + salon training', 'License exam prep', 'State board fee included', 'Professional kit', 'Color theory', 'CPR & Infection Control', 'Career placement'], careers: ['Cosmetologist', 'Colorist', 'Salon Manager'], cta: 'Get Started FREE', color: 'from-purple-500 to-pink-600', type: 'cosmetology', hot: false },
  { slug: 'esthetician-apprenticeship', title: 'Esthetician Apprenticeship', hours: '2,000', price: '$4,980', duration: '12-18 mo', image: PEXELS_IMAGES.esthetician, video: PEXELS_VIDEOS.spa, description: 'Master facials, skincare, chemical peels, and spa techniques.', included: ['2,000 hours RTI', 'Online + spa training', 'License exam prep', 'State board fee included', 'Professional kit', 'Chemical peels', 'CPR & Infection Control', 'Career placement'], careers: ['Esthetician', 'Medi-Spa', 'Skincare Pro'], cta: 'Start Your Journey', color: 'from-teal-500 to-cyan-600', type: 'esthetician', hot: true },
  { slug: 'nail-technician-apprenticeship', title: 'Nail Technician', hours: '2,000', price: '$4,980', duration: '12-18 mo', image: PEXELS_IMAGES.nail, video: PEXELS_VIDEOS.nail, description: 'Learn manicures, pedicures, gel, acrylics, and nail art.', included: ['2,000 hours RTI', 'Online + salon training', 'License exam prep', 'State board fee included', 'Professional kit', 'Gel & acrylic', 'CPR & Infection Control', 'Career placement'], careers: ['Nail Tech', 'Manicurist', 'Salon Owner'], cta: 'Apply FREE Today', color: 'from-rose-500 to-red-600', type: 'nail', hot: false },
];

const FUNDING_OPTIONS = [
  { name: 'Employer Sponsorship', icon: <Users className="w-8 h-8" />, description: 'Earn wages while you train at your current salon or spa', eligible: 'Employed at partner salon/spa', color: 'bg-teal-500', savings: 'Earn While You Learn' },
  { name: 'Self-Pay / BNPL', icon: <CreditCard className="w-8 h-8" />, description: '$600 down, then weekly payments. No eligibility required.', eligible: 'Everyone qualifies', color: 'bg-gray-600', savings: 'From $21/week' },
];

const STATS = [
  { value: '500+', label: 'Graduates Placed', icon: <Users className="w-5 h-5" /> },
  { value: '$55K+', label: 'Avg First Year', icon: <DollarSign className="w-5 h-5" /> },
  { value: '98%', label: 'Exam Pass Rate', icon: <Award className="w-5 h-5" /> },
  { value: '4.9★', label: 'Student Rating', icon: <Star className="w-5 h-5" /> },
];

export default function ApprenticeshipHub() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % PROGRAMS.length), 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const filteredShops = HOST_SHOPS.filter(shop => 
    (filterType === 'all' || shop.type === filterType) &&
    (shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || shop.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white">
      {/* URGENCY BANNER */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-4 text-sm font-bold">
          <span className="flex items-center gap-2 animate-pulse">⚡ NEXT COHORT: Limited Spots Available!</span>
          <span className="hidden md:flex items-center gap-2"><ThumbsUp className="w-4 h-4" /> 100% FREE to Apply</span>
          <a href="tel:3173143757" className="flex items-center gap-2 bg-white text-red-600 px-4 py-1 rounded-full hover:bg-gray-100">📞 (317) 314-3757</a>
        </div>
      </div>

      {/* TOP BAR */}
      <div className="bg-gray-900 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <a href="tel:3173143757" className="flex items-center gap-1 hover:text-amber-400"><Phone className="w-4 h-4" /> (317) 314-3757</a>
            <span className="hidden md:flex items-center gap-1"><MapPin className="w-4 h-4" /> Serving All 50 States</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-amber-400">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> DOL Registered</span>
            <span className="flex items-center gap-1"><Award className="w-4 h-4" /> ETPL Listed</span>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative h-[85vh] min-h-[650px] overflow-hidden">
        <div className="absolute inset-0 bg-gray-900">
          {PROGRAMS.map((program, idx) => (
            <div key={program.slug} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
              <video autoPlay muted loop playsInline className="w-full h-full object-cover" poster={program.image}>
                <source src={program.video} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            </div>
          ))}
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-sm font-black rounded-full animate-bounce">
                <Sparkles className="w-4 h-4" /> DOL REGISTERED APPRENTICESHIP
              </span>
              {PROGRAMS[currentSlide].hot && <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">🔥 MOST POPULAR</span>}
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">{PROGRAMS[currentSlide].title}</span>
            </h1>
            <p className="text-2xl text-white/90 mb-2 font-bold">{PROGRAMS[currentSlide].hours} Hours • {PROGRAMS[currentSlide].price} TOTAL</p>
            <p className="text-lg text-gray-300 mb-6">{PROGRAMS[currentSlide].description}</p>

            {/* PRICE BOX */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 inline-block">
              <div className="flex items-center gap-6">
                <div><p className="text-white/60 text-sm">Total</p><p className="text-4xl font-black text-amber-400">{PROGRAMS[currentSlide].price}</p></div>
                <div className="w-px h-12 bg-white/20" />
                <div><p className="text-white/60 text-sm">Deposit</p><p className="text-2xl font-bold text-green-400">$600</p></div>
                <div className="w-px h-12 bg-white/20" />
                <div><p className="text-white/60 text-sm">Weekly</p><p className="text-xl font-bold text-white">$21/wk</p></div>
              </div>
              <p className="text-green-400 text-sm mt-3 font-semibold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Most students pay $0 with funding!</p>
            </div>

            {/* CTA BUTTONS */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Link href={`/apply/${PROGRAMS[currentSlide].slug.replace('-apprenticeship', '-apprentice')}`} className="group inline-flex items-center px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xl font-black rounded-xl transition-all transform hover:scale-105 shadow-2xl shadow-amber-500/50">
                {PROGRAMS[currentSlide].cta} <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1" />
              </Link>
              <a href="tel:3173143757" className="inline-flex items-center px-8 py-5 border-2 border-white/50 text-white text-lg font-bold rounded-xl hover:bg-white/10">
                📞 Call (317) 314-3757
              </a>
            </div>

            <div className="flex flex-wrap gap-6 text-white/80 text-sm">
              <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> WIOA Approved</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> ETPL Listed</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Exam Included</span>
            </div>
          </div>
        </div>

        {/* SLIDE NAV */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {PROGRAMS.map((program, idx) => (
            <button key={program.slug} onClick={() => setCurrentSlide(idx)} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${idx === currentSlide ? 'bg-amber-500 text-black font-bold' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              {PROGRAM_ICONS[program.type]}
              <span className="hidden sm:inline">{program.title}</span>
            </button>
          ))}
        </div>

        <a href="/contact" className="absolute bottom-6 right-6 flex items-center gap-2 px-6 py-4 bg-green-500 hover:bg-green-400 text-white font-bold rounded-full shadow-2xl animate-bounce">
          <MessageCircle className="w-5 h-5" /> Chat Now!
        </a>
      </section>

      {/* STATS */}
      <section className="py-12 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/20 rounded-xl mb-3 text-amber-400">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-black text-white">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-amber-100 text-amber-700 text-sm font-bold rounded-full mb-4">WHY ELEVATE?</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Why 500+ Students Chose <span className="text-amber-500">Elevate</span></h2>
            <p className="text-xl text-gray-600">We're NOT a beauty school. We're a career launchpad.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Wrench className="w-8 h-8" />, title: 'Earn While You Learn', desc: 'Work in a REAL salon from day one. Get PAID while you train.', color: 'bg-amber-500' },
              { icon: <Target className="w-8 h-8" />, title: 'Guaranteed Placement', desc: 'We connect you with employers. 98% get hired within 60 days.', color: 'bg-blue-500' },
              { icon: <Building2 className="w-8 h-8" />, title: 'Real Experience', desc: 'No simulations. Trained by working professionals.', color: 'bg-purple-500' },
              { icon: <GraduationCap className="w-8 h-8" />, title: 'License Guaranteed', desc: 'Pass your exam or we retrain you FREE.', color: 'bg-teal-500' },
              { icon: <TrendingUp className="w-8 h-8" />, title: 'Career Growth', desc: 'Start as apprentice, become master, own your shop.', color: 'bg-rose-500' },
              { icon: <Briefcase className="w-8 h-8" />, title: 'Affordable Options', desc: '$600 down or employer sponsorship. Flexible payment plans available.', color: 'bg-green-500' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6`}>{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section id="programs" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-amber-100 text-amber-700 text-sm font-bold rounded-full mb-4">YOUR TRANSFORMATION STARTS HERE</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Barbering & Beauty Apprenticeship Programs</h2>
            <p className="text-xl text-gray-600">Choose your path. All programs include 2,000 hours, license prep, and career placement.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROGRAMS.map((program) => (
              <div key={program.slug} className="relative bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-amber-500">
                {program.hot && <div className="absolute top-4 right-4 z-10"><span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">🔥 HOT</span></div>}
                <div className="relative h-48 overflow-hidden">
                  <Image sizes="100vw" src={program.image} alt={program.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${program.color} opacity-70`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`${program.color} w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl`}>{PROGRAM_ICONS[program.type]}</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black text-gray-900 mb-2">{program.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                  <div className="flex gap-4 mb-4 text-center">
                    <div className="flex-1 bg-gray-50 rounded-lg p-2"><div className="text-lg font-bold text-gray-900">{program.hours}h</div><div className="text-xs text-gray-500">Training</div></div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-2"><div className="text-lg font-bold text-amber-600">{program.price}</div><div className="text-xs text-gray-500">Total</div></div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-2"><div className="text-lg font-bold text-gray-900">{program.duration}</div><div className="text-xs text-gray-500">Length</div></div>
                  </div>
                  <ul className="space-y-1 mb-4">
                    {program.included.slice(0, 4).map((item, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2"><CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />{item}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {program.careers.slice(0, 2).map((career, i) => (
                      <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">{career}</span>
                    ))}
                  </div>
                  <Link href="/beauty-checkout" className="block w-full text-center py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                    {program.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-gradient-to-r from-gray-900 via-amber-900 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-amber-500 text-black text-sm font-bold rounded-full mb-4">REAL STUDENTS. REAL RESULTS.</span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">They Were Broke. Now They're <span className="text-amber-400">THRIVING.</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex gap-1 mb-4">{[...Array(t.rating)].map((_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />)}</div>
                <p className="text-white mb-4 text-sm italic">"{t.quote}"</p>
                {t.earnings && <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4 text-center"><p className="text-green-400 text-xs font-bold uppercase">Now Earns</p><p className="text-2xl font-black text-green-400">{t.earnings}</p></div>}
                {t.revenue && <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 mb-4 text-center"><p className="text-amber-400 text-xs font-bold uppercase">Revenue Increase</p><p className="text-2xl font-black text-amber-400">{t.revenue}</p></div>}
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500"><Image sizes="100vw" src={t.image} alt={t.name} fill className="object-cover" /></div>
                  <div><h4 className="font-bold">{t.name}</h4><p className="text-amber-400 text-sm">{t.role}</p><p className="text-gray-400 text-xs">{t.location}</p></div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-2xl text-white mb-6">Ready to write YOUR success story?</p>
            <Link href="/apply" className="inline-flex items-center px-12 py-6 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xl font-black rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-2xl transform hover:scale-105">
              YES! I WANT TO CHANGE MY LIFE <ArrowRight className="w-6 h-6 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOST SHOPS */}
      <section id="host-shops" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-amber-100 text-amber-700 text-sm font-bold rounded-full mb-4">PARTNER LOCATIONS</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Find a Host Shop <span className="text-amber-500">Near You</span></h2>
          </div>
          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search by name or city..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {[{key:'all',label:'All',icon:<Sparkles className="w-4 h-4"/>},{key:'barber',label:'Barber',icon:<Scissors className="w-4 h-4"/>},{key:'cosmetology',label:'Cosmetology',icon:<Sparkles className="w-4 h-4"/>},{key:'esthetician',label:'Esthetician',icon:<Droplet className="w-4 h-4"/>},{key:'nail',label:'Nail',icon:<Flower2 className="w-4 h-4"/>}].map((type) => (
                <button key={type.key} onClick={() => setFilterType(type.key)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium ${filterType === type.key ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{type.icon}{type.label}</button>
              ))}
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-gray-100 rounded-2xl overflow-hidden h-[500px] relative">
              <iframe src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d198471.44798461953!2d-86.27645198468754!3d39.76840328482965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1shost%20shops%20barbershops%20salons%20indianapolis!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus" width="100%" height="100%" style={{border:0}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Host Shop Locations" />
              <div className="absolute top-4 left-4 bg-white/95 rounded-xl p-4 shadow-lg"><div className="text-3xl font-black text-amber-600">{HOST_SHOPS.length}+</div><div className="text-sm text-gray-600">Partner Locations</div></div>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {filteredShops.map((shop) => (
                <div key={shop.id} className="bg-white rounded-xl p-4 border-2 border-gray-100 hover:border-amber-200 transition-all">
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"><Image sizes="100vw" src={shop.image} alt={shop.name} fill className="object-cover" /></div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div><h4 className="font-bold text-gray-900 flex items-center gap-2">{shop.name}{shop.verified && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />Verified</span>}</h4><p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{shop.city}, {shop.state}</p></div>
                        <div className="text-right"><div className="flex items-center gap-1 text-amber-500"><Star className="w-4 h-4 fill-current" /><span className="font-bold">{shop.rating}</span></div><p className="text-xs text-gray-500">{shop.reviews} reviews</p></div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">{shop.specialties.map((s, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{s}</span>)}</div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-400 capitalize flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${shop.type === 'barber' ? 'bg-amber-500' : shop.type === 'cosmetology' ? 'bg-purple-500' : shop.type === 'esthetician' ? 'bg-teal-500' : 'bg-rose-500'}`}></span>{shop.type}</span>
                        <a href={`tel:${shop.phone}`} className="text-sm text-amber-600 font-bold flex items-center gap-1 hover:text-amber-700"><Phone className="w-4 h-4" />{shop.phone}</a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING & PAYMENT */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-amber-500 text-black text-sm font-bold rounded-full mb-4">SIMPLE PRICING</span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Only <span className="text-amber-400">$4,980</span> Total</h2>
            <p className="text-xl text-gray-400">That's less than 3 months of beauty school — AND you EARN while you train!</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center p-6 bg-teal-500/20 rounded-2xl border border-teal-500/30">
                <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Employer Sponsorship</h3>
                <p className="text-gray-400 mb-4">Already working at a salon or barbershop? Your employer covers tuition — you get PAID to learn!</p>
                <div className="text-3xl font-black text-teal-400">$0 OUT OF POCKET</div>
              </div>
              
              <div className="text-center p-6 bg-gray-500/20 rounded-2xl border border-gray-500/30">
                <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Self-Pay / BNPL</h3>
                <p className="text-gray-400 mb-4">$600 deposit, then easy weekly payments. No credit check. Everyone qualifies.</p>
                <div className="text-2xl font-bold text-gray-400">$600 deposit</div>
                <div className="text-lg text-gray-500">+ $21/week</div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-3xl font-black text-amber-400 mb-2">$4,980 Total Investment</p>
              <p className="text-gray-400">vs. $15,000+ at traditional beauty schools</p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <a href="tel:3173143757" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 text-lg">
              <Phone className="w-6 h-6 mr-2" /> Call (317) 314-3757
            </a>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/20 text-white font-bold rounded-full mb-6"><Clock className="w-5 h-5" /> LIMITED SPOTS - NEXT COHORT FILLING FAST</div>
          <h2 className="text-4xl md:text-6xl font-black text-black mb-6">Your Dream Career<br />Starts TODAY.</h2>
          <p className="text-xl text-black/80 mb-8">Stop dreaming. Start earning. Apply now - 100% FREE with no commitment.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply" className="inline-flex items-center px-12 py-6 bg-black text-white text-xl font-black rounded-xl hover:bg-gray-900 shadow-2xl transform hover:scale-105">APPLY NOW - IT'S FREE <ArrowRight className="w-6 h-6 ml-2" /></Link>
            <a href="tel:3173143757" className="inline-flex items-center px-8 py-6 bg-white text-black text-lg font-bold rounded-xl hover:bg-gray-100"><Phone className="w-6 h-6 mr-2" /> (317) 314-3757</a>
          </div>
          <p className="text-black/60 mt-6 text-sm">Free to apply • No credit card required • Funds may cover 100% of tuition</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div><h3 className="font-bold text-lg mb-4">Elevate for Humanity</h3><p className="text-gray-400 text-sm">AI-powered workforce development. Credentialing, compliance, apprenticeship coordination.</p><a href="tel:3173143757" className="text-amber-400 font-bold flex items-center gap-1 mt-4"><Phone className="w-4 h-4" /> (317) 314-3757</a></div>
            <div><h4 className="font-bold mb-4">Programs</h4><ul className="space-y-2 text-gray-400 text-sm"><li><Link href="/programs/barber-apprenticeship" className="hover:text-amber-400">Barber Apprenticeship</Link></li><li><Link href="/programs/cosmetology-apprenticeship" className="hover:text-amber-400">Cosmetology</Link></li><li><Link href="/programs/esthetician-apprenticeship" className="hover:text-amber-400">Esthetician</Link></li><li><Link href="/programs/nail-technician-apprenticeship" className="hover:text-amber-400">Nail Technician</Link></li></ul></div>
            <div><h4 className="font-bold mb-4">Quick Links</h4><ul className="space-y-2 text-gray-400 text-sm"><li><Link href="/apply" className="hover:text-amber-400">Apply Now</Link></li><li><Link href="/funding" className="hover:text-amber-400">Funding Options</Link></li><li><Link href="/check-eligibility" className="hover:text-amber-400">Check Eligibility</Link></li><li><Link href="/employers/become-host-shop" className="hover:text-amber-400">Host Shop Inquiry</Link></li></ul></div>
            <div><h4 className="font-bold mb-4">Contact</h4><ul className="space-y-2 text-gray-400 text-sm"><li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Serving All 50 States</li><li className="flex items-center gap-2"><Phone className="w-4 h-4" /> (317) 314-3757</li><li><a href="mailto:info@elevateforhumanity.org" className="hover:text-amber-400">info@elevateforhumanity.org</a></li></ul></div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-wrap justify-between items-center text-sm text-gray-500">
            <p>© 2024 Elevate for Humanity Career & Technical Institute. All rights reserved.</p>
            <div className="flex gap-4"><span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> DOL Registered</span><span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> ETPL Listed</span><span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> WIOA Approved</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
