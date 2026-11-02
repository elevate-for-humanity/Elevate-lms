import Link from 'next/link';
import { Facebook, Instagram, Linkedin, PlayCircle, Youtube } from 'lucide-react';
import { SOCIAL_LINKS } from '@/config/social-links';

const SOCIAL_ACTIONS = [
  { label: 'Facebook', href: SOCIAL_LINKS.facebook, icon: Facebook },
  { label: 'Instagram', href: SOCIAL_LINKS.instagram, icon: Instagram },
  { label: 'YouTube', href: SOCIAL_LINKS.youtube, icon: Youtube },
  { label: 'LinkedIn', href: SOCIAL_LINKS.linkedin, icon: Linkedin },
] as const;

export function HomeSocialAppCTA() {
  return (
    <section className="border-y border-slate-800 bg-slate-950 px-4 py-5 text-white" aria-labelledby="follow-elevate-heading">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="follow-elevate-heading" className="text-base font-bold">Stay connected</h2>
        <nav aria-label="Elevate social media" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {SOCIAL_ACTIONS.map((action) => (
            <a key={action.label} href={action.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-white hover:text-orange-300">
              <action.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {action.label}
            </a>
          ))}
          <Link href="/reels" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-white hover:text-orange-300">
            <PlayCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Videos
          </Link>
        </nav>
      </div>
    </section>
  );
}
