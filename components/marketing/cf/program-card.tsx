import Link from 'next/link';

type ProgramCardProps = {
  slug: string;
  title: string;
  summary: string;
  basePath?: string;
};

export function ProgramCard({ slug, title, summary, basePath = '/programs' }: ProgramCardProps) {
  return (
    <article className="rounded border p-6 hover:bg-slate-50">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-700">{summary}</p>
      <Link href={`${basePath}/${slug}`} className="mt-4 inline-block text-sm underline">
        View program
      </Link>
    </article>
  );
}
