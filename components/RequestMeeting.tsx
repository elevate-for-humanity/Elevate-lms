'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface RequestMeetingProps {
  context?: string;
}

const CALENDLY_URL = 'https://calendly.com/elevate-for-humanity/advisor-call';

export default function RequestMeeting({ context }: RequestMeetingProps) {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 text-center">
      <Calendar className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Need More Information?</h3>
      <p className="text-slate-600 text-sm mb-4 max-w-md mx-auto">
        {context || 'Have questions before applying? Schedule a free meeting with an advisor. No commitment required.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Schedule a Meeting
        </a>
        <Link
          href="/schedule/meeting"
          className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 font-bold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors"
        >
          More Scheduling Options
        </Link>
      </div>
    </div>
  );
}
