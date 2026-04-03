'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const avatarConfig: { pattern: RegExp; video: string; name: string }[] = [
  { pattern: /^\/admin$/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Admin Overview' },
  { pattern: /^\/admin\/dashboard/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Admin Dashboard' },
  { pattern: /^\/admin\/users/i, video: '/videos/avatars/orientation-guide.mp4', name: 'User Management' },
  { pattern: /^\/admin\/programs/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Program Management' },
  { pattern: /^\/admin\/reports/i, video: '/videos/avatars/financial-guide.mp4', name: 'Reports Guide' },
  { pattern: /^\/student-portal/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Student Guide' },
  { pattern: /^\/student/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Student Guide' },
  { pattern: /^\/instructor/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Instructor Guide' },
  { pattern: /^\/staff-portal/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Staff Guide' },
  { pattern: /^\/partner-portal/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Partner Guide' },
  { pattern: /^\/program-holder/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Program Guide' },
  { pattern: /^\/lms/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Learning Guide' },
  { pattern: /^\/courses/i, video: '/videos/avatars/ai-tutor.mp4', name: 'Course Guide' },
  { pattern: /^\/about$/i, video: '/videos/about-mission.mp4', name: 'About Elevate' },
  { pattern: /^\/careers/i, video: '/videos/avatars/home-welcome.mp4', name: 'Join Our Team' },
  { pattern: /^\/partners/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Partner With Us' },
  { pattern: /^\/apply$/i, video: '/videos/apply-section-video.mp4', name: 'Start Your Journey' },
  { pattern: /^\/enroll/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Enrollment Guide' },
  { pattern: /^\/(vita|tax|financial-aid)/i, video: '/videos/avatars/financial-guide.mp4', name: 'Financial Guide' },
  { pattern: /^\/(onboarding|orientation)/i, video: '/videos/avatars/orientation-guide.mp4', name: 'Orientation Guide' },
];

const excludedPatterns = [
  /^\/api/i, /^\/auth/i, /^\/login/i, /^\/signup/i, /^\/register/i,
  /^\/privacy/i, /^\/terms/i, /^\/policies/i, /^\/governance/i,
  /^\/accessibility/i, /^\/sitemap/i, /^\/404/i, /^\/500/i,
];

export default function GlobalAvatar() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const config = avatarConfig.find(c => c.pattern.test(pathname));
  const isExcluded = excludedPatterns.some(p => p.test(pathname));

  // Reset on page change
  useEffect(() => {
    setHasPlayed(false);
  }, [pathname]);

  // Auto-play with sound on scroll into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isExcluded || !config) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasPlayed) return;
        const video = videoRef.current;
        if (!video) return;

        video.muted = false;
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
          const unmute = () => {
            if (videoRef.current) videoRef.current.muted = false;
            document.removeEventListener('click', unmute);
            document.removeEventListener('scroll', unmute);
            document.removeEventListener('touchstart', unmute);
          };
          document.addEventListener('click', unmute, { once: true });
          document.addEventListener('scroll', unmute, { once: true });
          document.addEventListener('touchstart', unmute, { once: true });
        });
        setHasPlayed(true);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pathname, isExcluded, config, hasPlayed]);

  if (isExcluded || !config || videoFailed) return null;

  return (
    <section ref={containerRef} className="relative w-full bg-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          <video
            ref={videoRef}
            className="w-full aspect-video object-cover"
            playsInline
            preload="metadata"
            onError={() => setVideoFailed(true)}
          >
            <source src={config.video} type="video/mp4" />
          </video>
          <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
            <span className="bg-black/70 text-white text-xs font-medium rounded px-2 py-1">{config.name}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
