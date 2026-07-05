'use client';

/**
 * PremiumProgramDetailPage — Story-driven program page with:
 * - Scroll-triggered hero video
 * - Animated student journey sections
 * - BNPL calculator
 * - Premium visual design
 * - Dynamic animations
 * - No gradient overlays
 */

import { motion, useInView } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, Clock, Award, DollarSign, Users, Shield, 
  Play, ChevronDown, Calculator, Heart, Building, Briefcase
} from 'lucide-react';

interface PremiumProgramDetailPageProps {
  program: {
    slug: string;
    title: string;
    subtitle?: string;
    heroImage?: string;
    durationWeeks?: number;
    minimumAge?: number;
    selfPayCost?: string;
    deliveryMode?: string;
    credentials?: Array<{ name: string; issuer: string }>;
    fundingOptions?: Array<{ name: string; description: string }>;
    outcomes?: Array<{ icon: string; statement: string }>;
    storySections?: Array<{
      icon: string;
      title: string;
      description: string;
      stat?: { value: string; label: string };
    }>;
  };
  banner?: {
    videoSrcDesktop?: string;
    videoSrcMobile?: string;
    posterImage?: string;
    microLabel?: string;
    belowHeroHeadline?: string;
    belowHeroSubheadline?: string;
    primaryCta?: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
    trustIndicators?: string[];
    transcript?: string;
  } | null;
  heroPosterSrc?: string;
}

export default function PremiumProgramDetailPage({
  program,
  banner,
  heroPosterSrc,
}: PremiumProgramDetailPageProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const isHeroInView = useInView(heroRef, { amount: 0.3 });

  // Parse price
  const programPrice = program.selfPayCost 
    ? parseInt(program.selfPayCost.replace(/[^0-9]/g, ''), 10) || 0 
    : 0;

  // Scroll-triggered video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHeroInView && !isVideoPlaying) {
      video.play().catch(() => {});
      setIsVideoPlaying(true);
    } else if (!isHeroInView && isVideoPlaying) {
      video.pause();
      video.currentTime = 0;
      setIsVideoPlaying(false);
    }
  }, [isHeroInView, isVideoPlaying]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const replayVideo = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
      setIsVideoPlaying(true);
    }
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <div ref={heroRef} className="relative bg-slate-900">
        {/* Video Background */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <video
            ref={videoRef}
            src={banner?.videoSrcDesktop || ''}
            poster={banner?.posterImage || program.heroImage || heroPosterSrc}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted={isMuted}
            preload="metadata"
            onEnded={() => setIsVideoPlaying(false)}
          />

          {/* Video Overlay - Minimal, no gradients */}
          <div className="absolute inset-0 bg-slate-900/30" />

          {/* Hero Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center px-4 max-w-4xl"
            >
              {banner?.microLabel && (
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="inline-block px-4 py-1.5 bg-brand-red-600 text-white text-xs font-bold tracking-widest uppercase rounded-full mb-6"
                >
                  {banner.microLabel}
                </motion.span>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                {banner?.belowHeroHeadline || program.title}
              </h1>
              <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-8">
                {banner?.belowHeroSubheadline || program.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {banner?.primaryCta && (
                  <a
                    href={banner.primaryCta.href}
                    className="group relative w-full sm:w-auto bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <span className="relative z-10">{banner.primaryCta.label}</span>
                  </a>
                )}
                {banner?.secondaryCta && (
                  <a
                    href={banner.secondaryCta.href}
                    className="w-full sm:w-auto border-2 border-white/50 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-all"
                  >
                    {banner.secondaryCta.label}
                  </a>
                )}
              </div>
            </motion.div>
          </div>

          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!isVideoPlaying && (
                  <button
                    onClick={replayVideo}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    <span className="text-sm font-medium">Play</span>
                  </button>
                )}
                {isVideoPlaying && (
                  <span className="text-white/70 text-sm font-mono">▶ Playing</span>
                )}
              </div>
              <button
                onClick={toggleMute}
                className="text-white/80 hover:text-white transition-colors"
              >
                {isMuted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2"
          >
            <div className="flex flex-col items-center text-white/60 animate-bounce">
              <span className="text-xs font-medium mb-2">Scroll to explore</span>
              <ChevronDown className="w-5 h-5" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* PROGRAM AT A GLANCE */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { icon: Clock, label: 'Duration', value: `${program.durationWeeks || '6'} Weeks` },
              { icon: Award, label: 'Credential', value: program.credentials?.[0]?.name || 'Certificate' },
              { icon: DollarSign, label: 'Investment', value: program.selfPayCost || 'Varies' },
              { icon: Users, label: 'Class Size', value: 'Small Groups' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="text-center p-6 bg-slate-50 rounded-2xl hover:bg-brand-red-50 transition-colors"
              >
                <item.icon className="w-8 h-8 mx-auto mb-3 text-brand-red-600" />
                <div className="text-2xl font-bold text-slate-900 mb-1">{item.value}</div>
                <div className="text-sm text-slate-500">{item.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* STORY SECTIONS - Student Journey */}
      {program.storySections && program.storySections.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Your Journey to a New Career
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                From enrollment to employment, we walk with you every step of the way
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
              className="space-y-8"
            >
              {program.storySections.map((section, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className={`flex flex-col md:flex-row items-center gap-8 p-8 bg-white rounded-3xl shadow-lg border border-slate-100 ${
                    i % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="w-16 h-16 bg-brand-red-100 rounded-2xl flex items-center justify-center mb-6">
                      <span className="text-3xl">{section.icon}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{section.title}</h3>
                    <p className="text-slate-600 leading-relaxed mb-4">{section.description}</p>
                    {section.stat && (
                      <div className="inline-flex items-center gap-3 px-4 py-2 bg-green-50 rounded-full">
                        <span className="text-2xl font-bold text-green-600">{section.stat.value}</span>
                        <span className="text-sm text-green-700">{section.stat.label}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden">
                      <img
                        src={program.heroImage || heroPosterSrc}
                        alt={section.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Step Number */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-brand-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {i + 1}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* OUTCOMES SECTION */}
      {program.outcomes && program.outcomes.length > 0 && (
        <section className="py-20 bg-slate-900">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                What You'll Achieve
              </h2>
              <p className="text-lg text-slate-300">
                Industry-recognized credentials that open doors
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {program.outcomes.map((outcome, i) => (
                <motion.div
                  key={i}
                  variants={scaleIn}
                  className="flex items-start gap-4 p-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10"
                >
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-medium">{outcome.statement}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* BNPL CALCULATOR */}
      {programPrice > 0 && (
        <BNPLCalculator 
          programName={program.title} 
          programPrice={programPrice}
        />
      )}

      {/* FUNDING OPTIONS */}
      {program.fundingOptions && program.fundingOptions.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Funding & Support
              </h2>
              <p className="text-lg text-slate-600">
                Multiple pathways to make your training affordable
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {program.fundingOptions.map((option, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100"
                >
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                    <DollarSign className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{option.name}</h3>
                  <p className="text-slate-600">{option.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="py-20 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Join thousands of graduates who transformed their careers with Elevate
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`/apply?program=${program.slug}`}
                className="w-full sm:w-auto bg-white text-brand-red-600 font-bold px-10 py-4 rounded-xl hover:bg-slate-100 transition-all hover:shadow-xl"
              >
                Apply Now
              </a>
              <a
                href="/contact"
                className="w-full sm:w-auto border-2 border-white text-white font-bold px-10 py-4 rounded-xl hover:bg-white/10 transition-all"
              >
                Talk to an Advisor
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRANSCRIPT */}
      {banner?.transcript && (
        <section className="py-8 bg-slate-50 border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between py-3 text-left hover:bg-slate-100 rounded-lg px-4 transition-colors"
            >
              <span className="font-semibold text-slate-700">Video Transcript</span>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
            </button>
            {showTranscript && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="px-4 pb-4"
              >
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {banner.transcript}
                </p>
              </motion.div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BNPL Calculator Component                                            */
/* ------------------------------------------------------------------ */

function BNPLCalculator({ programName, programPrice }: { programName: string; programPrice: number }) {
  const [deposit, setDeposit] = useState(Math.round(programPrice * 0.2));
  const [months, setMonths] = useState(6);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const remaining = programPrice - deposit;
  const monthlyPayment = Math.round((remaining / months) * 100) / 100;

  const plans = [
    { months: 3, label: '3 Months' },
    { months: 6, label: '6 Months' },
    { months: 12, label: '12 Months' },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Calculator className="w-12 h-12 mx-auto mb-4 text-brand-red-400" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Budget-Friendly Payment Plan
          </h2>
          <p className="text-lg text-slate-300">
            Spread your {programName} training costs over time
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 shadow-2xl"
        >
          {/* Program Price */}
          <div className="text-center pb-8 mb-8 border-b border-slate-100">
            <div className="text-sm text-slate-500 uppercase tracking-wider mb-2">Total Program Cost</div>
            <div className="text-5xl font-bold text-slate-900">
              ${programPrice.toLocaleString()}
            </div>
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              0% Interest — WIOA Eligible
            </div>
          </div>

          {/* Plan Selection */}
          <div className="mb-8">
            <label className="text-sm font-semibold text-slate-700 mb-4 block">
              Select Your Payment Plan
            </label>
            <div className="grid grid-cols-3 gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.months}
                  onClick={() => setMonths(plan.months)}
                  className={`py-4 px-2 rounded-xl font-bold transition-all ${
                    months === plan.months
                      ? 'bg-brand-red-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {plan.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deposit Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-semibold text-slate-700">Initial Deposit</label>
              <div className="text-2xl font-bold text-brand-red-600">
                ${deposit.toLocaleString()}
              </div>
            </div>
            <input
              type="range"
              min={Math.round(programPrice * 0.1)}
              max={Math.round(programPrice * 0.5)}
              step={50}
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-red-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>10% deposit</span>
              <span>50% deposit</span>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gradient-to-r from-brand-red-50 to-orange-50 rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Remaining Balance</span>
              <span className="text-lg font-bold text-slate-900">${remaining.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Monthly Payment</span>
              <span className="text-3xl font-bold text-brand-red-600">
                ${monthlyPayment.toLocaleString()}<span className="text-lg font-normal text-slate-500">/mo</span>
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-600">Interest Rate</span>
              <span className="text-green-600 font-bold">0% APR</span>
            </div>
          </div>

          {/* Breakdown Toggle */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full text-left text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-2"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
            {showBreakdown ? 'Hide' : 'Show'} full payment breakdown
          </button>

          {/* Payment Schedule */}
          {showBreakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-8 p-4 bg-slate-50 rounded-xl"
            >
              {Array.from({ length: months }).map((_, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-slate-200 last:border-0">
                  <span className="text-slate-600">Payment {i + 1}</span>
                  <span className="font-medium text-slate-900">${monthlyPayment.toLocaleString()}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/check-eligibility"
              className="flex-1 text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Check My Eligibility
            </a>
            <a
              href="/funding"
              className="flex-1 text-center border-2 border-slate-300 text-slate-700 font-bold py-4 px-6 rounded-xl hover:border-brand-red-500 hover:text-brand-red-600 transition-all"
            >
              Explore Grants & Funding
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}