import Image from 'next/image';

export default function PartnerLogos() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-center text-sm font-semibold text-black uppercase tracking-wider mb-2">
          Aligned With & Serving In Collaboration With
        </h3>
        <p className="text-center text-xs text-black mb-8">
          Logos shown represent workforce development partnerships and program alignment. Not endorsements.
        </p>
        <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
          <div className="flex items-center justify-center h-16 w-32">
            <Image
              src="/images/partners/dwd.webp"
              alt="Indiana Department of Workforce Development"
              width={120}
              height={60}
              className="object-contain"
            />
          </div>
          <div className="flex items-center justify-center h-16 w-32">
            <Image
              src="/images/partners/workone.webp"
              alt="WorkOne Indiana"
              width={120}
              height={60}
              className="object-contain"
            />
          </div>
          <div className="flex items-center justify-center h-16 w-32">
            <Image
              src="/images/partners/usdol.webp"
              alt="US Department of Labor"
              width={120}
              height={60}
              className="object-contain"
            />
          </div>
          <div className="flex items-center justify-center h-16 w-32">
            <Image
              src="/images/partners/osha.webp"
              alt="OSHA Authorized"
              width={120}
              height={60}
              className="object-contain"
            />
          </div>
          <div className="flex items-center justify-center h-16 w-32">
            <Image
              src="/images/partners/nextleveljobs.webp"
              alt="Next Level Jobs"
              width={120}
              height={60}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
