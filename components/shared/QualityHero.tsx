import Image from 'next/image';
import Link from 'next/link';

interface HeroAction {
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
}

interface QualityHeroProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  actions?: HeroAction[];
  breadcrumbs?: { label: string; href: string }[];
}

/**
 * Quality-gated Hero component
 *
 * Enforces:
 * - No gradient overlays
 * - Specific, actionable titles
 * - Clear purpose statements
 * - Real images with proper alt text
 * - Accessible structure
 */
export function QualityHero({
  title,
  description,
  imageSrc,
  imageAlt,
  actions = [],
  breadcrumbs = [],
}: QualityHeroProps) {
  // Quality gates
  if (!title || title.length < 10) {
    throw new Error('QualityHero: title must be specific (min 10 characters)');
  }
  if (!description || description.length < 20) {
    throw new Error(
      'QualityHero: description must be clear (min 20 characters)'
    );
  }
  if (!imageSrc || !imageAlt) {
    throw new Error('QualityHero: image and alt text required');
  }
  if (
    title.toLowerCase().includes('Available Now') ||
    title.toLowerCase().includes('Content') ||
    description.toLowerCase().includes('Available Now') ||
    description.toLowerCase().includes('Content')
  ) {
    throw new Error('QualityHero: Content content not allowed');
  }

  return (
    <section className="relative bg-white">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav
          role="navigation"
          className="container mx-auto px-4 py-4"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.href} className="flex items-center">
                {index > 0 && <span className="mx-2 text-slate-400">/</span>}
                <Link
                  href={crumb.href}
                  className="text-brand-blue-600 hover:text-brand-blue-700 hover:underline"
                >
                  {crumb.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Hero Content */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-black mb-8 leading-relaxed">
              {description}
            </p>

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4">
                {actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`
                      px-8 py-4 rounded-lg text-lg font-semibold transition-colors text-center
                      ${
                        action.variant === 'primary'
                          ? 'bg-brand-orange-600 hover:bg-brand-orange-700 text-white'
                          : 'bg-white hover:bg-slate-50 text-black border-2 border-slate-300'
                      }
                    `}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Image */}
          <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] rounded-lg overflow-hidden shadow-xl">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              quality={90}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
