import Image from 'next/image';

interface SubpageHeroProps {
  title: string;
  description?: string;
  badge?: string;
}

export function SubpageHero({ title, description, badge }: SubpageHeroProps) {
  return (
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/images/pages/subpage-tax-hero.jpg" alt="Supersonic Fast Cash" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            {badge && (
              <span className="inline-block px-3 py-1 bg-brand-orange-600 text-white text-sm font-medium rounded-full mb-4">
                {badge}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h1>
            {description && (
              <p className="text-lg text-white max-w-3xl mx-auto">{description}</p>
            )}
          </div>
        </div>
      </section>
  );
}
