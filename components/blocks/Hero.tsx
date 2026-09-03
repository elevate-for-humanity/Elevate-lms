import Image from 'next/image';

interface HeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  ctaText?: string;
  ctaHref?: string;
  variant?: 'default' | 'centered' | 'split';
  badge?: string;
  badgeColor?: string;
  gradient?: string;
}

export default function Hero({
  title,
  subtitle,
  description,
  imageUrl,
  imageAlt = '',
  ctaText = 'Get Started',
  ctaHref = '/apply',
  variant = 'default',
  badge,
  badgeColor = 'bg-brand-red-600',
  gradient,
}: HeroProps) {
  const content = (
    <div className="space-y-4">
      {badge && (
        <span className={`inline-block px-3 py-1 text-sm font-medium text-white rounded-full ${badgeColor}`}>
          {badge}
        </span>
      )}
      {title && <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{title}</h1>}
      {subtitle && <p className="text-xl text-slate-600">{subtitle}</p>}
      {description && <p className="text-lg text-slate-700 max-w-2xl">{description}</p>}
      <div className="pt-4">
        <a
          href={ctaHref}
          className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-brand-red-600 rounded-lg hover:bg-brand-red-700 md:text-lg"
        >
          {ctaText}
        </a>
      </div>
    </div>
  );

  if (variant === 'centered') {
    return (
      <section className={`relative py-20 md:py-28 ${gradient || 'bg-gradient-to-br from-slate-50 to-white'}`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          {content}
        </div>
      </section>
    );
  }

  if (imageUrl && variant === 'split') {
    return (
      <section className={`relative py-16 md:py-24 ${gradient || 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>{content}</div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <Image src={imageUrl} alt={imageAlt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`relative py-16 md:py-24 ${gradient || 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4">
        {content}
        {imageUrl && (
          <div className="mt-12 relative aspect-[16/9] rounded-xl overflow-hidden">
            <Image src={imageUrl} alt={imageAlt} fill className="object-cover" sizes="100vw" />
          </div>
        )}
      </div>
    </section>
  );
}
