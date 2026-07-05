'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, CheckCircle, ChevronRight, Clock, Phone, Star, Users } from 'lucide-react';
import { AnimatedStats } from './AnimatedStats';
import { TrustBadges } from './TrustBadges';
import { AnimatedLogoStrip, PartnerLogoStrip } from './AnimatedLogoStrip';
import { AIAdvisorWidget } from './AIAdvisorWidget';
import { ProgramDiscovery } from './ProgramDiscovery';
import { ROICalculator } from './ROICalculator';
import { SalaryCalculator } from './SalaryCalculator';
import { SuccessStoriesGallery } from './SuccessStoriesGallery';
import { CareerPathways } from './CareerPathways';
import { useScrollAnimation } from '@/hooks/useAnimatedCounter';

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
function ProgramsPreview() {
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
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Trust Badges Strip */}
      <div className="bg-slate-50 border-y border-slate-200 py-4">
        <TrustBadges variant="section" />
      </div>

      {/* 3. How It Works */}
      <HowItWorksPreview />

      {/* 3b. Career Pathways - NEW */}
      <CareerPathways />

      {/* 4. Animated Stats */}
      <AnimatedStats
        stats={OUTCOME_STATS}
        title="Proven Results"
        subtitle="Our graduates succeed because we invest in their futures"
        dark={false}
      />

      {/* 4b. Program Discovery Quiz */}
      <ProgramDiscovery />

      {/* 5. Programs Preview */}
      <ProgramsPreview />

      {/* 6. Salary Calculator - NEW */}
      <SalaryCalculator />

      {/* 7. ROI Calculator - NEW */}
      <ROICalculator />

      {/* 8. Funding Section */}
      <FundingSection />

      {/* 9. Success Stories Gallery - NEW */}
      <SuccessStoriesGallery />

      {/* 10. Employer Partners */}
      <AnimatedLogoStrip />
      <PartnerLogoStrip variant="dark" />

      {/* 11. Final CTA */}
      <FinalCTA />

      {/* 12. AI Advisor Floating Widget */}
      <AIAdvisorWidget variant="floating" />
    </div>
  );
}

export default PremiumHomePage;
