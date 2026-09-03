import { Search } from 'lucide-react';

interface StudentSearchPanelProps {
  action: string;
  defaultValue?: string;
  label?: string;
  placeholder?: string;
}

export function StudentSearchPanel({
  action,
  defaultValue = '',
  label = 'Search participants',
  placeholder = 'Search by name or email…',
}: StudentSearchPanelProps) {
  return (
    <form action={action} method="GET" className="w-full">
      <label htmlFor="participant-search" className="mb-2 block text-sm font-semibold text-slate-900">
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          />
          <input
            id="participant-search"
            name="q"
            type="search"
            defaultValue={defaultValue}
            placeholder={placeholder}
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-950 outline-none focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-200"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-brand-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue-800 focus:outline-none focus:ring-2 focus:ring-brand-blue-300 focus:ring-offset-2"
        >
          Search
        </button>
      </div>
    </form>
  );
}
