const reviewRoot = 'https://elevate-podcast-review.elizabethpowell6262.chatgpt.site';
const media = [
  ['Overview audio', '/episode-01-paris.mp3'],
  ['Overview transcript', '/episode-01-transcript.md'],
  ['Education-access reel — draft', '/reel-education-paris.mp4'],
  ['AI-workflow reel — draft', '/reel-ai-workflows-paris.mp4'],
  ['Host-shop reel — draft', '/reel-host-shops-paris.mp4'],
] as const;

/** Mount only inside an admin-authorized surface. Never embed owner-only media. */
export default function PodcastProgramGuideReview({ authorized }: { authorized: boolean }) {
  if (!authorized) return null;
  return (
    <details className="my-4 min-w-0 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-slate-950">
      <summary className="min-h-11 cursor-pointer font-bold">
        Podcast &amp; program guide — private review
      </summary>
      <p className="mt-3 text-sm leading-6">
        Sign into the ChatGPT account that owns this preview. Elevate administrator access
        alone does not unlock these links. Reels are artwork-based narrated drafts.
      </p>
      <a href={reviewRoot} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 py-3 font-bold text-white">
        Open visual podcast and program guide (new tab)
      </a>
      <ul className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
        {media.map(([label, path]) => (
          <li key={path} className="min-w-0">
            <a href={`${reviewRoot}${path}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center break-words py-2 text-sm font-bold underline underline-offset-4">
              {label} (new tab)
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm leading-6">
        Review reference only: this does not import a course, publish lessons, award completion,
        or schedule social releases. The catalog in the guide is a snapshot; confirm current
        programs on the live website. Review Supersonic service and filing availability before sharing.
      </p>
    </details>
  );
}
