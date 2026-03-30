// Shared card shell used by every builder section
import type { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  required?: boolean;
  warning?: string;
  children: ReactNode;
}

export default function BuilderSection({ title, description, required, warning, children }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {title}
              {required && <span className="ml-1.5 text-xs font-normal text-red-500">required</span>}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          </div>
        </div>
        {warning && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {warning}
          </div>
        )}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}
