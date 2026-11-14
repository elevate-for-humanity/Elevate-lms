'use client';

export default function ProgramHolderError({ reset }: { reset: () => void }) {
  return (
    <main role="alert" className="mx-auto max-w-2xl space-y-4 px-4 py-12">
      <h1 className="text-2xl font-black">This workspace could not load</h1>
      <p>Your information has not been replaced with empty results. Try again to reload the current records.</p>
      <button onClick={reset} className="min-h-11 rounded-xl bg-blue-700 px-5 font-bold text-white">Try again</button>
    </main>
  );
}
