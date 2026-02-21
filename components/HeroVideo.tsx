'use client';

export function HeroVideo() {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      style={{
        objectFit: 'cover',
        width: '100%',
        height: '100%',
      }}
    >
      <source src="/videos/barber-hero.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}
