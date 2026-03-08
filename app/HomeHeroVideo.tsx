'use client';

import Image from 'next/image';

export default function HomeHeroVideo() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Poster — always visible until video loads */}
      <Image
        src="/images/pages/home-hero-video.jpg"
        alt="Elevate for Humanity career training"
        fill priority sizes="100vw"
        className="object-cover object-center"
      />
      {/* autoPlay + muted + playsInline is the only reliable cross-browser combo.
          No JS needed — browser handles it natively. */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover object-center"
        poster="/images/pages/home-hero-video.jpg"
      >
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
