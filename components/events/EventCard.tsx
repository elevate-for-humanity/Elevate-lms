import Link from 'next/link';
import { Calendar, MapPin, Video, Users, ArrowRight } from 'lucide-react';
import type { ElevateEvent } from '@/lib/data/events';
import { formatEventDate, eventTypeLabel, eventTypeBadgeColor } from '@/lib/data/events';

interface EventCardProps {
  event: ElevateEvent;
  /** href to link to. Defaults to /events/[id] */
  href?: string;
  /** Show a compact layout (used in sidebars / calendar) */
  compact?: boolean;
}

export default function EventCard({ event, href, compact = false }: EventCardProps) {
  const dest = href ?? `/events/${event.slug ?? event.id}`;
  const isPast = new Date(event.start_date) < new Date();

  if (compact) {
    return (
      <Link
        href={dest}
        className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-brand-blue-300 hover:shadow-sm transition-all group"
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-blue-50 flex flex-col items-center justify-center text-brand-blue-700">
          <span className="text-xs font-bold leading-none">
            {new Date(event.start_date).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
          </span>
          <span className="text-lg font-bold leading-none">
            {new Date(event.start_date).getDate()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-blue-700 line-clamp-2 leading-snug">
            {event.title}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {event.is_virtual ? 'Virtual' : event.location ?? 'Indianapolis, IN'}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={dest}
      className={`group block bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${
        isPast ? 'border-slate-200 opacity-75' : 'border-slate-200 hover:border-brand-blue-200'
      }`}
    >
      {/* Date strip */}
      <div className="flex items-center gap-4 px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-brand-blue-600 flex flex-col items-center justify-center text-white shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
            {new Date(event.start_date).toLocaleString('en-US', { month: 'short' })}
          </span>
          <span className="text-2xl font-bold leading-none mt-0.5">
            {new Date(event.start_date).getDate()}
          </span>
        </div>
        <div className="min-w-0">
          <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-1 ${eventTypeBadgeColor(event.event_type)}`}>
            {eventTypeLabel(event.event_type)}
          </span>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            {formatEventDate(event.start_date, event.end_date)}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-brand-blue-700 transition-colors line-clamp-2">
          {event.title}
        </h3>
        {event.description && (
          <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{event.description}</p>
        )}

        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
          {event.is_virtual ? (
            <span className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-teal-500" /> Virtual Event
            </span>
          ) : event.location ? (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {event.location}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Indianapolis, IN
            </span>
          )}
          {event.max_attendees && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {event.max_attendees} seats
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-600 group-hover:gap-2.5 transition-all">
          {isPast ? 'View recap' : event.registration_required ? 'Register now' : 'Learn more'}
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
