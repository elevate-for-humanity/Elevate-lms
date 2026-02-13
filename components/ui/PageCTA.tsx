import Link from 'next/link';
import { Phone } from 'lucide-react';

interface PageCTAProps {
  title?: string;
  description?: string;
  primaryText?: string;
  primaryHref?: string;
  showPhone?: boolean;
}

export default function PageCTA({
  title = 'Ready to Start Your Career?',
  description = 'Apply today for free career training programs.',
  primaryText = 'Apply Now',
  primaryHref = '/apply',
  showPhone = true,
}: PageCTAProps) {
  return (
    <section className="bg-blue-700 text-white py-12 mt-12">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">{title}</h2>
        <p className="text-blue-100 mb-6">{description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            {primaryText}
          </Link>
          {showPhone && (
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Get Help
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
