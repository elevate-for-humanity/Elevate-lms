import Link from 'next/link';

interface HeroProps {
  title: string;
  subtitle?: string;
  cta?: string;
  cta_label?: string;
  cta_secondary?: string;
  cta_secondary_label?: string;
  bg_color?: string;
}

export default function Hero({
  title,
  subtitle,
  cta,
  cta_label = 'Get Started',
  cta_secondary,
  cta_secondary_label = 'Learn More',
  bg_color = 'brand-blue',
}: HeroProps) {
  return (
    <section className={`bg-${bg_color}-700 text-white py-20 px-4`}>
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{title}</h1>
        {subtitle && (
          <p className="text-xl md:text-2xl text-white/80 mb-10">{subtitle}</p>
        )}
        {(cta || cta_secondary) && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {cta && (
              <Link
                href={cta}
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 transition-all"
              >
                {cta_label}
              </Link>
            )}
            {cta_secondary && (
              <Link
                href={cta_secondary}
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition-all"
              >
                {cta_secondary_label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
