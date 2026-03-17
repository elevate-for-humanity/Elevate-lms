import Image from 'next/image';
import Link from 'next/link';

interface Props {
  image: string;
  alt: string;
  title: string;
  subtitle?: string;
}

/**
 * Full-bleed image hero for Rise Up Foundation / VITA pages.
 * No text on the image. Title/subtitle render in a white band below.
 */
export default function VITAPageHero({ image, alt, title, subtitle }: Props) {
  return (
    <>
      <section className="relative w-full h-[60vh] min-h-[400px]">
        <Image
          src={image}
          alt={alt}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      </section>
      <div className="bg-white border-b border-slate-100 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">{title}</h1>
          {subtitle && (
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6">{subtitle}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/tax/rise-up-foundation/free-tax-help" className="px-7 py-3 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors text-sm">
              Get Free Tax Help
            </Link>
            <Link href="/tax/rise-up-foundation/site-locator" className="px-7 py-3 bg-white border-2 border-emerald-700 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors text-sm">
              Find a VITA Site
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
