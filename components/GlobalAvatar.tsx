'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

/**
 * GlobalAvatar - Video avatar component
 * 
 * RULES:
 * 1. DISABLED by default - pages must be explicitly listed
 * 2. No repeated videos across unrelated pages
 * 3. Silent on governance/policy pages
 * 4. Different videos for marketing vs LMS
 */

// Pages where video avatar is ENABLED (explicit allowlist)
// If a page is not listed here, NO video avatar appears
const avatarConfig: { pattern: RegExp; video: string; name: string }[] = [
  // Homepage — handled by PageAvatar in app/page.tsx
  
  // ============ DASHBOARD PORTALS ============
  
  // Admin Dashboard
  { pattern: /^\/admin$/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Admin Overview' },
  { pattern: /^\/admin\/dashboard/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Admin Dashboard' },
  { pattern: /^\/admin\/users/i, video: '/videos/avatars/orientation-guide.mp4', name: 'User Management' },
  { pattern: /^\/admin\/programs/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Program Management' },
  { pattern: /^\/admin\/reports/i, video: '/videos/avatars/financial-guide.mp4', name: 'Reports Guide' },
  
  // Student Portal
  { pattern: /^\/student-portal$/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Student Welcome' },
  { pattern: /^\/student-portal\/dashboard/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Your Dashboard' },
  { pattern: /^\/student-portal\/courses/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Your Courses' },
  { pattern: /^\/student-portal\/grades/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Your Grades' },
  { pattern: /^\/student/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Student Guide' },
  
  // Instructor Portal
  { pattern: /^\/instructor$/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Instructor Welcome' },
  { pattern: /^\/instructor\/dashboard/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Instructor Dashboard' },
  { pattern: /^\/instructor\/courses/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Course Management' },
  { pattern: /^\/instructor\/students/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Student Management' },
  
  // Employer Portal — uses its own PageAvatar
  
  // Staff Portal
  { pattern: /^\/staff-portal$/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Staff Welcome' },
  { pattern: /^\/staff-portal\/dashboard/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Staff Dashboard' },
  { pattern: /^\/staff-portal\/students/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Student Records' },
  
  // Partner Portal
  { pattern: /^\/partner-portal$/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Partner Welcome' },
  { pattern: /^\/partner-portal\/dashboard/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Partner Dashboard' },
  
  // Program Holder Portal
  { pattern: /^\/program-holder$/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Program Holder Welcome' },
  { pattern: /^\/program-holder\/dashboard/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Program Dashboard' },
  { pattern: /^\/program-holder\/programs/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Your Programs' },
  
  // ============ LMS / COURSES ============
  
  { pattern: /^\/lms\/courses/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Course Library' },
  { pattern: /^\/lms\/dashboard/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Learning Dashboard' },
  { pattern: /^\/lms/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Learning Portal' },
  { pattern: /^\/courses/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Course Guide' },
  { pattern: /^\/learn/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Learning Guide' },
  
  // ============ PUBLIC PAGES ============
  
  // About pages
  { pattern: /^\/about$/i, video: '/videos/about-mission.mp4', name: 'About Elevate' },
  { pattern: /^\/about\/team/i, video: '/videos/avatars/home-welcome.mp4', name: 'Meet Our Team' },
  { pattern: /^\/about\/mission/i, video: '/videos/about-mission.mp4', name: 'Our Mission' },
  
  // Contact page — uses its own PageAvatar
  
  // Careers page
  { pattern: /^\/careers/i, video: '/videos/avatars/home-welcome.mp4', name: 'Join Our Team' },
  
  // Partners/Employers pages
  { pattern: /^\/partners/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Partner With Us' },
  // Employers page — uses its own PageAvatar
  
  // Apply/Enroll pages
  { pattern: /^\/apply$/i, video: '/videos/apply-section-video.mp4', name: 'Start Your Journey' },
  { pattern: /^\/enroll/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Enrollment Guide' },
  { pattern: /^\/inquiry/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Get Information' },
  
  // Program pages use their own PageAvatar component — do not duplicate here
  // Pages with PageAvatar: barber, cdl, cna, healthcare, hvac, skilled-trades, drug-collector, tax-preparation
  
  // Financial/Tax pages (funding pages excluded per audit)
  { pattern: /^\/(vita|tax|financial-aid)/i, video: '/videos/avatars/financial-guide.mp4', name: 'Financial Guide' },
  
  // Store pages - checkout only
  { pattern: /^\/store\/checkout/i, video: '/videos/avatars/store-assistant.mp4', name: 'Checkout Guide' },
  
  // Onboarding/Orientation pages
  { pattern: /^\/(onboarding|orientation)/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Orientation Guide' },
  
  // NO DEFAULT FALLBACK - if not listed above, no avatar appears
];

// Pages that should NEVER show the avatar
// This is a safety net - primary control is the allowlist above
const excludedPatterns = [
  /^\/api/i,
  /^\/auth/i,
  /^\/login/i,
  /^\/signup/i,
  /^\/register/i,
  /^\/privacy/i,
  /^\/terms/i,
  /^\/policies/i,
  /^\/governance/i,
  /^\/accessibility/i,
  /^\/sitemap/i,
  /^\/404/i,
  /^\/500/i,
];

export default function GlobalAvatar() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Find matching avatar config
  const config = avatarConfig.find(c => c.pattern.test(pathname));
  const isExcluded = excludedPatterns.some(pattern => pattern.test(pathname));

  // Scroll-triggered visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isExcluded || !config) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pathname, isExcluded, config]);

  // Auto-play when visible, pause when not
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isExcluded || !config) return;
    if (isVisible) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else if (!video.paused) {
      video.pause();
      setIsPlaying(false);
    }
  }, [isVisible, isExcluded, config]);

  // Reset state on page change
  useEffect(() => {
    setIsPlaying(false);
    setIsMuted(true);
    setHasInteracted(false);
    setIsVisible(false);
  }, [pathname]);

  if (isExcluded || !config) return null;

  const unmute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setIsMuted(false);
    setHasInteracted(true);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    setHasInteracted(true);
  };

  return (
    <section ref={containerRef} className="relative w-full bg-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          <video
            ref={videoRef}
            className="w-full aspect-video object-cover"
            playsInline
            muted
            preload="auto"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={config.video} type="video/mp4" />
          </video>

          {/* Tap to unmute — shown when playing muted before user interaction */}
          {isPlaying && isMuted && !hasInteracted && (
            <button
              onClick={unmute}
              className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
              aria-label="Tap to unmute"
            >
              <span className="flex items-center gap-2 bg-black/70 hover:bg-black/80 text-white text-sm font-semibold rounded-full px-5 py-2.5 transition-colors shadow-lg backdrop-blur-sm">
                <VolumeX className="w-5 h-5" />
                Tap to unmute
              </span>
            </button>
          )}

          {/* Play button — shown when paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
              aria-label="Play video"
            >
              <span className="flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-base font-bold rounded-full px-6 py-3 transition-colors shadow-lg">
                <Play className="w-6 h-6 fill-white" />
                Play
              </span>
            </button>
          )}

          {/* Controls — shown after user has interacted */}
          {isPlaying && hasInteracted && (
            <div className="absolute bottom-4 left-4 z-20 flex gap-2">
              <button
                onClick={togglePlay}
                className="p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                title="Pause"
              >
                <Pause className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={toggleMute}
                className="p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
            </div>
          )}

          <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
            <span className="bg-black/70 text-white text-xs font-medium rounded px-2 py-1">{config.name}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
