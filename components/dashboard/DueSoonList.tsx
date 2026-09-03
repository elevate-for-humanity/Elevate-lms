// components/dashboard/DueSoonList.tsx
type DueSoonItem = {
  id: string;
  title: string;
  course_title: string;
  due_date: string;
  type: string;
};

type Props = {
  items: DueSoonItem[];
};

export function DueSoonList({ items }: Props) {
  if (!items.length) {
    return (
      <p className="text-xs text-slate-500">
        Nothing due in the next 7 days. Nice work staying ahead!
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-xs">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col rounded-xl bg-slate-50 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-black">{item.title}</span>
            <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-black">
              {item.type}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{item.course_title}</span>
            <span>
              Due{' '}
              {new Date(item.due_date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
