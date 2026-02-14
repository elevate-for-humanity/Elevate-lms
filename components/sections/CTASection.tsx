import Link from 'next/link';

interface CTAButton {
  text: string;
  href: string;
}

interface CTASectionProps {
  title?: string;
  description?: string;
  primaryCTA?: CTAButton;
  secondaryCTA?: CTAButton;
}

export function CTASection({
  title = 'Ready to Get Started?',
  description = 'Apply now or talk to an advisor to learn more about our programs.',
  primaryCTA = { text: 'Apply Now', href: '/apply' },
  secondaryCTA = { text: 'Contact Us', href: '/contact' },
}: CTASectionProps) {
  return (
    <section className="bg-zinc-900 text-white py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">{title}</h2>
        <p className="text-xl text-white/90 mb-8">{description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={primaryCTA.href}
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all"
          >
            {primaryCTA.text}
          </Link>
          <Link
            href={secondaryCTA.href}
            className="px-8 py-4 bg-white hover:bg-gray-100 text-brand-blue-900 font-bold rounded-lg transition-all"
          >
            {secondaryCTA.text}
          </Link>
        </div>
      </div>
    </section>
  );
}
