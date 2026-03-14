import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface EventsEmptyStateProps {
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function EventsEmptyState({
  message = 'No upcoming events scheduled. Check back soon or contact us to be notified.',
  ctaLabel = 'Contact Us',
  ctaHref = '/contact',
}: EventsEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 px-8 text-center">
      <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-600 font-medium">{message}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-block text-sm text-brand-blue-600 hover:underline font-medium"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
