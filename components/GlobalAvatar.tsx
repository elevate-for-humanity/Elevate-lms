'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

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
  
  // Employer Portal
  { pattern: /^\/employer-portal$/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Employer Welcome' },
  { pattern: /^\/employer-portal\/dashboard/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Employer Dashboard' },
  { pattern: /^\/employer-portal\/candidates/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Find Candidates' },
  { pattern: /^\/employer-portal\/jobs/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Job Postings' },
  
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
  
  // Contact page
  { pattern: /^\/contact/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Contact Us' },
  
  // Careers page
  { pattern: /^\/careers/i, video: '/videos/avatars/home-welcome.mp4', name: 'Join Our Team' },
  
  // Partners/Employers pages
  { pattern: /^\/partners/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Partner With Us' },
  { pattern: /^\/employers/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Employer Partners' },
  
  // Apply/Enroll pages
  { pattern: /^\/apply$/i, video: '/videos/apply-section-video.mp4', name: 'Start Your Journey' },
  { pattern: /^\/enroll/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Enrollment Guide' },
  { pattern: /^\/inquiry/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Get Information' },
  
  // Programs landing
  { pattern: /^\/programs$/i, video: '/videos/avatars/home-welcome.mp4', name: 'Explore Programs' },
  
  // Healthcare pages
  { pattern: /^\/programs\/healthcare/i, video: '/videos/avatars/healthcare-guide.mp4', name: 'Healthcare Guide' },
  
  // Barber pages
  { pattern: /^\/programs\/barber/i, video: '/videos/avatars/barber-guide.mp4', name: 'Barber Guide' },
  
  // Skilled trades pages
  { pattern: /^\/programs\/skilled-trades/i, video: '/videos/avatars/trades-guide.mp4', name: 'Trades Guide' },
  { pattern: /^\/programs\/cdl/i, video: '/videos/avatars/trades-guide.mp4', name: 'CDL Guide' },
  
  // Technology pages
  { pattern: /^\/programs\/technology/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Tech Guide' },
  
  // Business page
  { pattern: /^\/programs\/business/i, video: '/videos/avatars/financial-guide.mp4', name: 'Business Guide' },
  
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
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Find matching avatar config
  const config = avatarConfig.find(c => c.pattern.test(pathname));
  
  // Check if excluded
  const isExcluded = excludedPatterns.some(pattern => pattern.test(pathname));

  // Auto-play on page load (must be before any returns)
  useEffect(() => {
    if (isExcluded || !config) return;
    
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = true;
    video.volume = 0;
    video.play().catch(() => {
      // Browser blocked autoplay - will play on interaction
    });
  }, [pathname, isExcluded, config]);
  
  // Don't show on excluded pages
  if (isExcluded) {
    return null;
  }
  
  if (!config) {
    return null;
  }
  
  return (
    <section className="relative w-full bg-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          <video
            ref={videoRef}
            className="w-full aspect-video object-cover"
            playsInline
            autoPlay
            muted
            preload="metadata"
          >
            <source src={config.video} type="video/mp4" />
          </video>
          <div className="absolute bottom-4 left-4 bg-black/60 text-white px-4 py-2 rounded-lg">
            <span className="font-medium">{config.name}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
