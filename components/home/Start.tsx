import Link from 'next/link';

export default function Start() {
  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-brand-red-600 mb-8">
          Start with clarity
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/programs"
            className="px-8 py-4 bg-brand-red-600 text-white text-lg font-semibold rounded hover:bg-brand-red-700 transition"
          >
            Explore Programs
          </Link>
          <Link
            href="/wioa-eligibility"
            className="px-8 py-4 bg-white text-brand-red-600 text-lg font-semibold rounded border-2 border-brand-red-600 hover:bg-gray-50 transition"
          >
            Check Eligibility
          </Link>
        </div>
        
        <p className="text-black text-base">
          You are not signing up for a promise. You are entering a framework designed to work.
        </p>
      </div>
    </section>
  );
}
