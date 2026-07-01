import Link from 'next/link';
import { DAILY_THEORY_POLICY } from '@/lib/beauty-apprenticeship/theory-policy';

type Props = {
  programTitle: string;
  className?: string;
};

export default function BeautyTheoryDailyPolicy({ programTitle, className = '' }: Props) {
  return (
    <section className={`py-12 bg-slate-50 border-y border-slate-200 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-2">
          Daily theory requirement
        </p>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Theory quiz required every training day ({DAILY_THEORY_POLICY.passingScore}% to pass)
        </h2>
        <p className="text-slate-700 mb-6 leading-relaxed">{DAILY_THEORY_POLICY.summary}</p>
        <ul className="space-y-3 mb-6">
          {DAILY_THEORY_POLICY.rules.map((rule) => (
            <li key={rule} className="flex items-start gap-2 text-slate-700 text-sm leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0 mt-2" />
              {rule}
            </li>
          ))}
        </ul>
        <p className="text-sm text-slate-600">
          {programTitle} apprentices complete bookwork in Elevate LMS.{' '}
          <Link href="/apprentice" className="text-brand-blue-600 font-semibold hover:underline">
            Open apprentice portal
          </Link>{' '}
          to start today&apos;s theory.
        </p>
      </div>
    </section>
  );
}
