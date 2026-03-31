import Image from 'next/image';

export default function Assurance() {
  return (
    <section className="bg-gray-50 py-12 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <Image
          src="/clear-path-main-image.jpg"
          alt="Clear Pathways Background"
          fill
          className="object-cover"
          priority
         sizes="100vw" />
      </div>
      <div className="max-w-7xl mx-auto px-6 relative z-10 aspect-[4/3]">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative w-full aspect-video md:aspect-[4/3] rounded-lg overflow-hidden shadow-xl bg-gray-100">
            <Image
              src="/clear-path-main-image.jpg"
              alt="Clear Career Pathways"
              fill
              className="object-contain"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-2xl md:text-4xl font-bold text-black">
              A Clear Path, Not a Guess
            </h2>
            <div className="text-base md:text-xl text-black leading-relaxed space-y-4">
              <p>
                Too many people are told to "go get a skill" without being shown how it works. 
                Here, programs are structured, requirements are visible, and the process is 
                designed to be navigated.
              </p>
              <p className="text-lg md:text-2xl font-semibold text-black">
                No hype. No shortcuts. Just a legitimate pathway.
              </p>
              <p>
                This site is organized around approved pathways and credentialing frameworks 
                so you can make decisions with confidence. The goal is simple: fewer dead ends, 
                more forward motion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
