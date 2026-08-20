import Link from 'next/link';
import { notFound } from 'next/navigation';

const TOPICS: Record<string, { title: string; steps: string[] }> = {
  'getting-started': { title: 'Getting Started', steps: ['Choose a program and complete the public application.', 'Sign in with the account connected to your enrollment.', 'Open your learner dashboard to review assigned courses and required documents.'] },
  application: { title: 'Application', steps: ['Open the student application.', 'Complete all required contact, program, and eligibility fields.', 'Submit the application and follow the status instructions shown on screen.'] },
  dashboard: { title: 'Learner Dashboard', steps: ['Sign in to the learner portal.', 'Use My Courses for assigned training.', 'Review alerts and required actions before starting coursework.'] },
  assignments: { title: 'Assignments', steps: ['Open My Courses and select the active course.', 'Open Assignments to review due dates and requirements.', 'Submit work through the assignment screen and confirm the submission status.'] },
  'ai-tutor': { title: 'AI Tutor', steps: ['Open the AI Tutor from the LMS.', 'Ask a specific question about the concept you are studying.', 'Use course-specific tutoring inside your assigned course when you need course context.'] },
  'career-services': { title: 'Career Services', steps: ['Open your learner dashboard.', 'Review available career-support resources and employer opportunities.', 'Contact support when you need placement or resume assistance.'] },
  billing: { title: 'Billing and Payments', steps: ['Review your enrollment or account payment information.', 'Use the payment method shown for your program or plan.', 'Contact support before submitting duplicate payments when a transaction is pending.'] },
  mobile: { title: 'Mobile Access', steps: ['Open Elevate in a supported mobile browser.', 'Sign in with the same account used on desktop.', 'Install the available PWA when your browser presents the install option.'] },
};

export default async function TutorialTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const article = TOPICS[topic];
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        <Link href="/help/tutorials" className="text-sm font-semibold text-blue-700">← Tutorials</Link>
        <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">{article.title}</h1>
          <ol className="mt-8 space-y-5">
            {article.steps.map((step, index) => (
              <li key={step} className="flex gap-4 text-slate-700">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800">{index + 1}</span>
                <span className="pt-1 leading-7">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <Link href="/help" className="font-semibold text-blue-700">Open Help Center</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
