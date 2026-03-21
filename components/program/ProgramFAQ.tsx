import React from 'react';

export default function ProgramFAQ() {
  const items = [
    {
      q: 'How do I get started?',
      a: 'Apply first. After you submit, we confirm your goals, eligibility, and program fit. Then we guide you into the next step: funding approval, enrollment, or apprenticeship placement (depending on the program).',
    },
    {
      q: 'Is training really free?',
      a: "Many students qualify for workforce funding (WIOA/WRG/JRI) or employer sponsorship, which can cover all or most costs. If you don't qualify, you can still enroll using self-pay or payment plans (if available at checkout).",
    },
    {
      q: 'What funding options do you accept?',
      a: 'Workforce funding (WIOA/WRG/JRI), employer-paid sponsorship, self-pay (card), and pay-in-4 options (Klarna/Afterpay/Zip) if available at checkout.',
    },
    {
      q: "Why don't I always see Klarna/Afterpay/Zip at checkout?",
      a: "Those options appear automatically only when supported for your total, eligibility, and Stripe settings. If you don't see them, it usually means that option isn't available for that purchase.",
    },
    {
      q: 'How long does the program take?',
      a: 'It depends on the program and your schedule. Some tracks are designed to finish in weeks, others in months. Your program page lists the expected timeline and schedule options.',
    },
    {
      q: 'Is this online, in-person, or hybrid?',
      a: 'Each program lists the delivery model. Many programs offer hybrid options (online theory + in-person labs/clinical/shop hours where required).',
    },
    {
      q: 'Do I need experience to start?',
      a: 'Most programs start from beginner level. If a program has prerequisites (age, diploma/GED, background checks, immunizations, tools, licensing steps), it will be listed clearly on the program page.',
    },
    {
      q: 'What if I already completed hours or training somewhere else?',
      a: 'If allowed, we can review transcripts, prior training, or documented hours and tell you what can be transferred. Transfer rules depend on the program type and state requirements.',
    },
    {
      q: 'How do apprenticeships work (Earn While You Learn)?',
      a: 'Apprenticeships are job-based training. You learn on-site under supervision, complete required theory, and log hours. You may earn through hourly pay/commission/tips depending on the employer setup.',
    },
    {
      q: 'Will I earn a certificate or credential?',
      a: "If the program includes a credential pathway, you'll receive completion documentation and/or credential guidance. The exact outcome depends on the program.",
    },
    {
      q: 'What support do you offer beyond training?',
      a: 'Onboarding, progress tracking, reporting (when funding requires it), career readiness, and employer alignment where applicable.',
    },
    {
      q: 'Who do I contact if I need help today?',
      a: "Use the contact button on the page or call/text the number listed on the site. If you already applied, reply to your confirmation message and we'll route you to the right coordinator.",
    },
  ];

  return (
    <section className="mt-8 rounded-2xl border p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">FAQ</h2>
      <div className="mt-4 space-y-3">
        {items.map((it) => (
          <details key={it.q} className="rounded-xl border p-4">
            <summary className="cursor-pointer font-semibold">{it.q}</summary>
            <p className="mt-2 text-sm text-black">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
