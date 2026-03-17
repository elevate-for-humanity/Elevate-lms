import Image from 'next/image';

interface Props {
  image: string;
  alt: string;
  title: string;
  subtitle?: string;
}

/**
 * Full-bleed image hero for Supersonic Fast Cash pages.
 * No text on the image. Title/subtitle render in a white band below.
 */
export default function SupersonicPageHero({ image, alt, title, subtitle }: Props) {
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
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>
    </>
  );
}
