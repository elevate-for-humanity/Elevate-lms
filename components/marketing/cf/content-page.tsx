type Section = {
  heading: string;
  body: string;
};

type ContentPageProps = {
  title: string;
  lead?: string;
  sections: Section[];
  cta?: {
    label: string;
    href: string;
  };
};

export function ContentPage({ title, lead, sections, cta }: ContentPageProps) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">{title}</h1>
      {lead && <p className="mt-4 text-lg text-slate-700">{lead}</p>}

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-xl font-semibold">{section.heading}</h2>
            <p className="mt-3 text-slate-700">{section.body}</p>
          </div>
        ))}
      </div>

      {cta && (
        <div className="mt-10">
          <a href={cta.href} className="rounded bg-black px-5 py-3 text-white hover:bg-slate-800">
            {cta.label}
          </a>
        </div>
      )}
    </section>
  );
}
