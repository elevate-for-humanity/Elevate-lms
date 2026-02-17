// components/marketing/HowItWorksAndPlatform.tsx

const steps = [
  {
    step: "1",
    title: "Connect & explore options",
    body: "Share your goals and situation. We look at funding, approvals, and which programs actually fit your life.",
  },
  {
    step: "2",
    title: "Enroll & train with support",
    body: "Enroll with one of our training partners. You get coaching, reminders, and barrier-busting help along the way.",
  },
  {
    step: "3",
    title: "Move into jobs & apprenticeships",
    body: "We stay connected with employers and workforce partners to help you move into real roles, not just finish a class.",
  },
];

const platform = [
  {
    label: "Student Portal",
    body: "Assignments, attendance, milestones, and messages in one place, so you always know what's next.",
  },
  {
    label: "Employer Dashboard",
    body: "See your candidates, hours, OJT / WEX status, and outcomes across programs and cohorts.",
  },
  {
    label: "Mobile App",
    body: "Stay on track from your phone with nudges, check-ins, and quick access to your coach.",
  },
];

export function HowItWorksAndPlatform() {
  return (
    <section className="border-y border-slate-800 bg-slate-950/95">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Steps */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-orange-300">
              How it works
            </h2>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              A whole ecosystem around each learner.
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Elevate is designed for real lives — justice-involved learners,
              parents, career changers, and employers who want to hire
              differently. We tie funding, training, and employment together.
            </p>

            <ol className="mt-8 space-y-5">
              {steps.map((step) => (
                <li
                  key={step.step}
                  className="flex gap-4 rounded-3xl bg-slate-900/80 p-4 ring-1 ring-slate-800"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-400 text-sm font-semibold text-slate-950">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-50">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Platform */}
          <div className="rounded-3xl bg-slate-900/80 p-5 ring-1 ring-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-orange-300">
              The Elevate platform
            </h3>
            <p className="mt-2 text-lg font-semibold text-slate-50">
              People + technology that keep everyone aligned.
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Student and employer portals, mobile, and real humans behind the
              screens so case managers, workforce boards, and employers can see
              what's happening in real time.
            </p>

            <dl className="mt-6 space-y-4">
              {platform.map((item) => (
                <div key={item.label} className="space-y-1">
                  <dt className="text-sm font-semibold text-slate-50">
                    {item.label}
                  </dt>
                  <dd className="text-sm text-slate-300">{item.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
