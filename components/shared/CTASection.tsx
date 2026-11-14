import Link from 'next/link';

/**
 * CTASection — locked final CTA block for all student-facing pages.
 *
 * Always bg-slate-900. Never bg-white with white text.
 * Buttons: primary (brand-red), ICC (brand-blue), secondary (border).
 * Import and use this instead of writing one-off CTA sections.
 */
interface CTASectionProps {
  heading: string;
  body: string;
  primaryLabel?: string;
  primaryHref?: string;
  showICC?: boolean;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export default function CTASection({
  heading,
  body,
  primaryLabel = 'Apply Now',
  primaryHref = '/start',
  showICC = false,
  secondaryLabel,
  secondaryHref,
}: CTASectionProps) {
  return (
    <section className="bg-slate-900 py-14 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">{heading}</h2>
        <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-xl mx-auto">{body}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={primaryHref}
            className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-xl transition-colors text-base"
          >
            {primaryLabel}
          </Link>
          {showICC && (
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-10 py-4 rounded-xl transition-colors text-base"
            >
              Go to Indiana Career Connect
            </a>
          )}
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="border-2 border-slate-600 hover:border-slate-400 text-white font-bold px-10 py-4 rounded-xl transition-colors text-base"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
