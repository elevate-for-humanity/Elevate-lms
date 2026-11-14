type CtaBandProps = {
  heading: string;
  subheading?: string;
  label: string;
  href: string;
};

export function CtaBand({ heading, subheading, label, href }: CtaBandProps) {
  return (
    <section className="border-t bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 text-center">
        <h2 className="text-2xl font-bold">{heading}</h2>
        {subheading && <p className="mt-3 text-slate-700">{subheading}</p>}
        <a
          href={href}
          className="mt-6 inline-block rounded bg-black px-6 py-3 text-white hover:bg-slate-800"
        >
          {label}
        </a>
      </div>
    </section>
  );
}
