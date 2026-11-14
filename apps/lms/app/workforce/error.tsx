'use client';
export default function WorkforceError({ reset }: { reset: () => void }) {
  return (
    <section className="space-y-4 p-6" role="alert">
      <h1 className="text-xl font-bold">Workforce records could not be loaded</h1>
      <p>
        The data or workspace permissions could not be verified. Contact an administrator if
        retrying does not resolve this.
      </p>
      <button className="min-h-11 rounded border px-4" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
