import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative w-full -mt-[72px]">
      <div className="relative min-h-[100vh] sm:min-h-[70vh] md:min-h-[75vh] w-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home.mp4" type="video/mp4" />
        </video>
      </div>
    </section>
  );
}
