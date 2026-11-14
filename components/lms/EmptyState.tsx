import { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-5xl text-slate-300 text-3xl md:text-4xl lg:text-5xl">
        {icon ?? '📭'}
      </div>
      <h3 className="text-lg font-semibold text-black">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-black">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
