import Link from 'next/link';

export default function PrimaryCtas() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-6">
      <Link
        href="/programs"
        className="inline-flex justify-center rounded-xl bg-zinc-900 text-white px-5 py-3 font-extrabold hover:bg-zinc-800 transition"
      >
        Explore Programs
      </Link>
      <Link
        href="/platform"
        className="inline-flex justify-center rounded-xl border border-zinc-300 bg-white px-5 py-3 font-extrabold hover:bg-zinc-50 transition"
      >
        License the Platform
      </Link>
    </div>
  );
}
