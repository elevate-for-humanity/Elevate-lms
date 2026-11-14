'use client';
import { logger } from '@/lib/logger';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Play, Clock } from 'lucide-react';

interface NextAction {
  action: string;
  route: string;
  cta: string;
  description: string;
  program_name?: string;
  why?: string;
  estimated_minutes?: number;
  progress_percentage?: number;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  ORIENTATION: <BookOpen className="w-5 h-5" />,
  DOCUMENTS: <FileText className="w-5 h-5" />,
  START_COURSE_1: <Play className="w-5 h-5" />,
  CONTINUE_LEARNING: <Play className="w-5 h-5" />,
  AWAIT_PLACEMENT: <Clock className="w-5 h-5" />,
  AWAIT_APPROVAL: <Clock className="w-5 h-5" />,
  COMPLETE_PAYMENT: <ArrowRight className="w-5 h-5" />,
  OPEN_DASHBOARD: <ArrowRight className="w-5 h-5" />,
  EXPLORE_PROGRAMS: <BookOpen className="w-5 h-5" />,
};

export function NextActionBanner() {
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNextAction() {
      try {
        const response = await fetch('/api/enrollment/next-action');
        if (response.ok) {
          const data = await response.json();
          if (data.action) {
            setNextAction(data);
          }
        }
      } catch (err) {
        logger.error('Failed to fetch next action:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNextAction();
  }, []);

  if (loading || !nextAction) {
    return null;
  }

  return (
    <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center text-brand-blue-600">
            {ACTION_ICONS[nextAction.action] || <ArrowRight className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Next required action</h3>
            <p className="text-sm text-slate-700">{nextAction.description}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              {nextAction.why ? <span>Why: {nextAction.why}</span> : null}
              {nextAction.estimated_minutes ? (
                <span>About {nextAction.estimated_minutes} minutes</span>
              ) : null}
            </div>
          </div>
        </div>
        <Link
          href={nextAction.route}
          className="flex-shrink-0 inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {nextAction.cta}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
