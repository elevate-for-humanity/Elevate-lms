import { requireAdmin } from '@/lib/auth';
import { PRIVATE_APPLICATION_CHECKER_URL } from '@/lib/admin/application-checker';
import { applicationCheckWorkflow, readApplicationCheck } from '@/lib/admin/application-check-status';
import { studioRepository } from '@/lib/devstudio/repository';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Application Checker', robots: { index: false, follow: false } };

export default async function ApplicationCheckerPage() {
  await requireAdmin();
  let check: Awaited<ReturnType<typeof readApplicationCheck>> = null;
  let unavailable = false;
  try { check = await readApplicationCheck(); } catch { unavailable = true; }
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <h1 className="text-3xl font-bold">Application Checker</h1>
      <p>Elevate tests the student intake and host shop application journeys when code reaches main.</p>
      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="text-xl font-bold">Latest enrollment check</h2>
        {check ? (
          <>
            <p>GitHub reports <strong>{check.status}</strong> for commit <code>{check.sha.slice(0, 12)}</code>.</p>
            <a className="inline-flex min-h-11 items-center underline" href={check.url}>View the job and individual test results</a>
          </>
        ) : <p role="status">{unavailable ? 'GitHub could not verify the latest check.' : 'No check on main has been recorded.'}</p>}
        <a className="block underline" href={`https://github.com/${studioRepository()}/actions/workflows/${applicationCheckWorkflow}`}>Open workflow history</a>
      </section>
      <a className="inline-flex min-h-11 items-center underline" href="https://www.elevateforhumanity.org/apply">Open the live application chooser</a>
      <details>
        <summary className="min-h-11 cursor-pointer font-semibold">Optional private review tool</summary>
        <a className="inline-flex min-h-11 items-center underline" href={PRIVATE_APPLICATION_CHECKER_URL} target="_blank" rel="noopener noreferrer">Open the owner’s ChatGPT application checker</a>
      </details>
    </main>
  );
}
