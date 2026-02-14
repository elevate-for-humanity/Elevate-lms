'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Play, Clock } from 'lucide-react';

interface NextAction {
  action: string;
  route: string;
  cta: string;
  description: string;
  program_name?: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  ORIENTATION: <BookOpen className="w-5 h-5" />,
  DOCUMENTS: <FileText className="w-5 h-5" />,
  START_COURSE_1: <Play className="w-5 h-5" />,
  CONTINUE_LEARNING: <Play className="w-5 h-5" />,
  AWAIT_PLACEMENT: <Clock className="w-5 h-5" />,
  AWAIT_APPROVAL: <Clock className="w-5 h-5" />,
  COMPLETE_PAYMENT: <ArrowRight className="w-5 h-5" />,
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
          if (data.action && data.action !== 'CONTINUE_LEARNING') {
            setNextAction(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch next action:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNextAction();
  }, []);

  if (loading || !nextAction) {
    return null;
  }

  // Don't show banner if user is already active and learning
  if (nextAction.action === 'CONTINUE_LEARNING') {
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
            <h3 className="font-semibold text-gray-900">Next required action</h3>
            <p className="text-sm text-gray-600">{nextAction.description}</p>
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
