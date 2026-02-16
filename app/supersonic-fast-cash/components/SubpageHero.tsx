import Image from 'next/image';

interface SubpageHeroProps {
  title: string;
  description?: string;
  badge?: string;
}

export function SubpageHero({ title, description, badge }: SubpageHeroProps) {
  return (
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/business/tax-prep.jpg" alt="Supersonic Fast Cash" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">{description}</p>
          </div>
        </div>
      </section>
  );
}
