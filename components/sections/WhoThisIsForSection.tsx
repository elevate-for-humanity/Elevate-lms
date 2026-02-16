
interface WhoThisIsForSectionProps {
  items: string[];
  title?: string;
}

export function WhoThisIsForSection({
  items,
  title = 'Who This Program Is For',
}: WhoThisIsForSectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-3xl font-bold text-black mb-6">{title}</h2>
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <ul className="space-y-4">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-black">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
