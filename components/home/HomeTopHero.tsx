import Image from 'next/image';

export function HomeTopHero() {
  return (
    <section className="relative w-full overflow-hidden">
      <Image
        src="/images/pages/prog-hero-main-2.jpg"
        alt="Elevate for Humanity - Empowering Futures Through Innovation & Opportunity"
        width={1920}
        height={800}
        priority
        className="h-[280px] sm:h-[360px] md:h-[420px] lg:h-[500px] w-full object-cover"
        sizes="100vw"
      />
      {/* Overlay content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 leading-tight">
            Elevate For Humanity
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl">
            Empowering Futures Through Innovation & Opportunity
          </p>
        </div>
      </div>
    </section>
  );
}
