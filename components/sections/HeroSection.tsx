import Link from 'next/link';

interface Badge {
  text: string;
  color: string; // 'green' | 'blue' | 'orange' | 'purple'
}

interface CTAButton {
  text: string;
  href: string;
}

interface HeroSectionProps {
  title: string;
  description: string;
  badges?: Badge[];
  primaryCTA?: CTAButton;
  secondaryCTA?: CTAButton;
}

const badgeColors = {
  green: 'bg-brand-green-500',
  blue: 'bg-brand-blue-500',
  orange: 'bg-brand-orange-500',
  purple: 'bg-purple-500',
};

export function HeroSection({
  title,
  description,
  badges = [],
  primaryCTA = { text: 'Apply Now', href: '/apply' },
  secondaryCTA = { text: 'Talk to an Advisor', href: '/contact' },
}: HeroSectionProps) {
  return (
    <section className="bg-brand-blue-700 text-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {badges.map((badge, index) => (
              <span
                key={index}
                className={`px-4 py-2 ${badgeColors[badge.color as keyof typeof badgeColors] || 'bg-brand-blue-500'} text-white text-sm font-bold rounded-full`}
              >
                {badge.text}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">{title}</h1>

        {/* Description */}
        <p className="text-xl text-white/90 mb-8 max-w-3xl">{description}</p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={primaryCTA.href}
            className="px-8 py-4 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold rounded-lg transition-all text-center"
          >
            {primaryCTA.text}
          </Link>
          <Link
            href={secondaryCTA.href}
            className="px-8 py-4 bg-white hover:bg-gray-100 text-brand-blue-900 font-bold rounded-lg transition-all text-center"
          >
            {secondaryCTA.text}
          </Link>
        </div>
      </div>
    </section>
  );
}
