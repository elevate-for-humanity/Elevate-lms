'use client';

/**
 * ScrollHeroVideo — Premium hero that plays on scroll, pauses when out of view.
 * 
 * Features:
 * - Scroll-triggered playback (Intersection Observer)
 * - Auto-pause when scrolled out of view
 * - No looping
 * - Proper sizing with aspect ratio
 * - Premium design with smooth animations
 * - Mobile responsive
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Volume2, VolumeX, Play, ChevronDown } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { motion, useInView } from 'framer-motion';

export interface ScrollHeroVideoProps {
  /** Desktop video source */
  videoSrcDesktop: string;
  /** Mobile video source */
  videoSrcMobile?: string;
  /** Video poster for loading state */
  posterImage?: string;
  /** Voiceover audio */
  voiceoverSrc?: string;
  /** Micro-label (2-4 words) */
  microLabel?: string;
  /** Brand name */
  brandName?: string;
  /** Brand logo URL */
  brandLogo?: string;
  /** Headline below video */
  headline: string;
  /** Subheadline */
  subheadline?: string;
  /** Primary CTA */
  primaryCta?: { label: string; href: string };
  /** Secondary CTA */
  secondaryCta?: { label: string; href: string };
  /** Trust indicators */
  trustIndicators?: string[];
  /** Transcript */
  transcript?: string;
  /** Analytics name */
  analyticsName?: string;
  /** Additional className */
  className?: string;
  /** Story sections below hero */
  storySections?: StorySection[];
  /** BNPL Calculator component */
  showCalculator?: boolean;
  /** Program details for calculator */
  programPrice?: number;
  programName?: string;
}

export interface StorySection {
  icon: string;
  title: string;
  description: string;
  stat?: { value: string; label: string };
}

export default function ScrollHeroVideo({
  videoSrcDesktop,
  videoSrcMobile,
  posterImage,
  voiceoverSrc,
  microLabel,
  brandName = PLATFORM_DEFAULTS.orgName,
  brandLogo,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  trustIndicators,
  transcript,
  analyticsName,
  className = '',
  storySections = [],
  showCalculator = false,
  programPrice = 0,
  programName = '',
}: ScrollHeroVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const isInView = useInView(containerRef, { amount: 0.3 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const videoSrc = isMobile && videoSrcMobile ? videoSrcMobile : videoSrcDesktop;

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll-triggered playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView && !isPlaying) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else if (!isInView && isPlaying) {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isInView, isPlaying]);

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Video error handler
  const handleVideoError = useCallback(() => {
    setVideoLoaded(false);
  }, []);

  // Video loaded handler
  const handleVideoLoaded = useCallback(() => {
    setVideoLoaded(true);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!isMuted) {
      video && (video.muted = true);
      audio && audio.pause();
      setIsMuted(true);
    } else {
      video && (video.muted = false);
      audio && audio.play().catch(() => {});
      setIsMuted(false);
    }
  }, [isMuted]);

  // Replay video
  const replayVideo = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, []);

  // Framer motion variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* HERO VIDEO SECTION */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
        {/* Video Container - 16:9 aspect ratio, responsive */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterImage}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted={isMuted}
            preload="metadata"
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            onLoadedData={handleVideoLoaded}
            aria-label={analyticsName ? `${analyticsName} hero video` : 'Program hero video'}
          />
          
          {/* Loading Skeleton */}
          {!videoLoaded && (
            <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-slate-600 border-t-brand-red-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Playback Controls Overlay */}
          {videoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Play Button (shown when not playing) */}
              {!isPlaying && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={replayVideo}
                  className="group relative w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all"
                  aria-label="Play video"
                >
                  <Play className="w-8 h-8 text-white fill-white ml-1 group-hover:scale-110 transition-transform" />
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* Video Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Micro Label */}
            {microLabel && (
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-white/90 text-xs font-semibold tracking-wider uppercase"
              >
                {microLabel}
              </motion.span>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Progress Indicator */}
              <div className={`text-white/70 text-xs font-mono ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                {isPlaying ? '▶ Playing' : '○ Paused'}
              </div>

              {/* Mute Toggle */}
              <button
                onClick={toggleMute}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5 text-brand-red-400" />
                )}
              </button>

              {/* Replay Button */}
              <button
                onClick={replayVideo}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Replay video"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Brand Badge */}
        {brandLogo && (
          <div className="absolute top-4 left-4 z-10">
            <img src={brandLogo} alt={brandName} className="h-8 w-auto opacity-90" />
          </div>
        )}

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="flex flex-col items-center text-white/60">
            <span className="text-xs font-medium mb-2">Scroll to explore</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* Hidden Audio for Voiceover */}
      {voiceoverSrc && (
        <audio ref={audioRef} src={voiceoverSrc} preload="none" />
      )}

      {/* BELOW HERO CONTENT */}
      <section className="bg-white">
        {/* Main Content */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto px-4 py-16 sm:py-24"
        >
          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 text-center mb-6 leading-tight"
          >
            {headline}
          </motion.h1>

          {/* Subheadline */}
          {subheadline && (
            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-slate-600 text-center max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              {subheadline}
            </motion.p>
          )}

          {/* CTAs */}
          {(primaryCta || secondaryCta) && (
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              {primaryCta && (
                <a
                  href={primaryCta.href}
                  className="group relative w-full sm:w-auto text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-brand-red-500/30 hover:-translate-y-0.5"
                >
                  <span className="relative z-10">{primaryCta.label}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-red-700 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                </a>
              )}
              {secondaryCta && (
                <a
                  href={secondaryCta.href}
                  className="w-full sm:w-auto text-center border-2 border-slate-300 text-slate-700 font-bold px-8 py-4 rounded-xl hover:border-brand-red-500 hover:text-brand-red-600 transition-all"
                >
                  {secondaryCta.label}
                </a>
              )}
            </motion.div>
          )}

          {/* Trust Indicators */}
          {trustIndicators && trustIndicators.length > 0 && (
            <motion.ul
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
            >
              {trustIndicators.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-600 text-sm">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </motion.ul>
          )}
        </motion.div>

        {/* Story Sections */}
        {storySections.length > 0 && (
          <div className="bg-gradient-to-b from-slate-50 to-white py-16">
            <div className="max-w-5xl mx-auto px-4">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
                className="grid md:grid-cols-3 gap-8"
              >
                {storySections.map((section, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100"
                  >
                    {/* Icon */}
                    <div className="w-14 h-14 bg-brand-red-50 rounded-xl flex items-center justify-center mb-6">
                      <span className="text-2xl">{section.icon}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {section.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 leading-relaxed mb-4">
                      {section.description}
                    </p>

                    {/* Stat */}
                    {section.stat && (
                      <div className="pt-4 border-t border-slate-100">
                        <div className="text-3xl font-bold text-brand-red-600">{section.stat.value}</div>
                        <div className="text-sm text-slate-500">{section.stat.label}</div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        )}

        {/* BNPL Calculator */}
        {showCalculator && programPrice > 0 && (
          <BNPLCalculator programName={programName} programPrice={programPrice} />
        )}

        {/* Transcript */}
        {transcript && (
          <div className="border-t border-slate-100">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-700">Video Transcript</span>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
            </button>
            {showTranscript && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="px-4 pb-6"
              >
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {transcript}
                </p>
              </motion.div>
            )}
          </div>
        )}
      </section>
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
  const monthlyPayment = Math.round(remaining / months * 100) / 100;
  const totalInterest = 0; // BNPL 0% interest eligible programs

  const plans = [
    { months: 3, label: '3 months' },
    { months: 6, label: '6 months' },
    { months: 12, label: '12 months' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16"
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
           Flexible Payment Options
          </h2>
          <p className="text-slate-300 text-lg">
            Budget-friendly installments for your {programName} training
          </p>
        </div>

        {/* Calculator */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Price Display */}
          <div className="text-center mb-8 pb-6 border-b border-slate-100">
            <div className="text-sm text-slate-500 uppercase tracking-wider mb-1">Program Cost</div>
            <div className="text-4xl sm:text-5xl font-bold text-slate-900">
              ${programPrice.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 font-medium mt-2">
              ✓ WIOA & Workforce Ready Grant eligible
            </div>
          </div>

          {/* Plan Selection */}
          <div className="mb-8">
            <label className="text-sm font-semibold text-slate-700 mb-3 block">Payment Plan</label>
            <div className="grid grid-cols-3 gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.months}
                  onClick={() => setMonths(plan.months)}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
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
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-slate-700">Initial Deposit</label>
              <span className="text-lg font-bold text-brand-red-600">${deposit.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={Math.round(programPrice * 0.1)}
              max={Math.round(programPrice * 0.5)}
              step={50}
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-red-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>10%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gradient-to-r from-brand-red-50 to-brand-red-50/50 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-600">Remaining Balance</span>
              <span className="text-xl font-bold text-slate-900">${remaining.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-600">Monthly Payment</span>
              <span className="text-2xl font-bold text-brand-red-600">
                ${monthlyPayment.toLocaleString()}/mo
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Interest Rate</span>
              <span className="text-green-600 font-semibold">0% APR</span>
            </div>
          </div>

          {/* Breakdown Toggle */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            {showBreakdown ? 'Hide' : 'Show'} payment breakdown →
          </button>

          {/* Payment Breakdown */}
          {showBreakdown && (
            <div className="space-y-2 mb-6">
              {Array.from({ length: months }).map((_, i) => (
                <div key={i} className="flex justify-between text-sm py-2 border-b border-slate-100">
                  <span className="text-slate-600">Payment {i + 1}</span>
                  <span className="font-medium text-slate-900">${monthlyPayment.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/check-eligibility"
              className="flex-1 text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all"
            >
              Check My Eligibility
            </a>
            <a
              href="/funding"
              className="flex-1 text-center border-2 border-slate-300 text-slate-700 font-bold py-4 px-6 rounded-xl hover:border-brand-red-500 hover:text-brand-red-600 transition-all"
            >
              Explore Grants
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}