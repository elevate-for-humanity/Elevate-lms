import { ReactNode } from 'react';

interface HeroVideoProps {
  videoSrc: string;
  posterSrc?: string;
  overlayOpacity?: 30 | 40; // Only allow 30% or 40% per design policy
  children?: ReactNode;
  className?: string;
}

/**
 * HeroVideo Component
 *
 * Enforces design policy for hero video banners.
 *
 * DESIGN POLICY:
 * - Real videos only (no Contents)
 * - Light overlay (30-40% max)
 * - Autoplay, muted, looping
 * - Mobile-friendly (playsInline)
 *
 * @param videoSrc - Path to video file in /public/videos/
 * @param posterSrc - Optional poster image for fallback
 * @param overlayOpacity - Overlay darkness (30 or 40, default 40)
 * @param children - Content to display over video
 * @param className - Additional classes for section
 */
export function HeroVideo({
  videoSrc,
  posterSrc,
  overlayOpacity = 40,
  children,
  className = '',
}: HeroVideoProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Video Background */}
      <video
        autoPlay
        loop
        playsInline
        muted
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Overlay - Design Policy: 30-40% max */}

      {/* Content */}
      <div className="relative">{children}</div>
    </section>
  );
}

/**
 * Usage Example:
 *
 * <HeroVideo
 *   videoSrc="/videos/hero-home.mp4"
 *   posterSrc="/images/pages/home-hero-video.jpg"
 *   overlayOpacity={40}
 *   className="min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]"
 * >
 *   <div className="max-w-7xl mx-auto px-4 py-20">
 *     <h1 className="text-5xl font-bold text-white">
 *       Free Job Training
 *     </h1>
 *     <Button href="/apply">Apply Now</Button>
 *   </div>
 * </HeroVideo>
 */
