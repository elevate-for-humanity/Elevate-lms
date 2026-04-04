// components/marketing/SuccessStories.tsx

const stories = [
  {
    name: "Guide",
    role: "Barber Apprenticeship Graduate",
    quote:
      "From incarceration to owning my own chair. Elevate gave me structure, accountability, and a real pathway.",
  },
  {
    name: "Sharon",
    role: "Medical Assistant Graduate",
    quote:
      "I'm a single mom and thought school wasn't possible. Elevate helped me get funded, stay on track, and step into a real job.",
  },
  {
    name: "Alicia",
    role: "Healthcare Graduate",
    quote:
      "They didn't just enroll me and disappear. The coaching and employer connections made the difference.",
  },
];

export function SuccessStories() {
  return (
    <section className="bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-orange-300">
            Success stories
          </h2>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Real people, real outcomes.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Elevate For Humanity is built around people — not just programs.
            These stories are just the start of what happens when approvals,
            funding, and employers line up.
          </p>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {stories.map((story) => (
            <article
              key={story.name}
              className="flex flex-col rounded-3xl bg-slate-900/80 p-5 ring-1 ring-slate-800"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white" />
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {story.name}
                  </h3>
                  <p className="text-xs text-white">{story.role}</p>
                </div>
              </div>
              <p className="text-sm text-white">&ldquo;{story.quote}&rdquo;</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
