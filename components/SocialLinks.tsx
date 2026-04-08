import { SOCIAL_LINKS } from '@/config/social-links';

export function SocialLinks() {
  const platforms = [
    { key: 'facebook' as const, label: 'Facebook' },
    { key: 'youtube'  as const, label: 'YouTube'  },
    { key: 'linkedin' as const, label: 'LinkedIn'  },
  ] as const;

  return (
    <div className="flex items-center gap-2">
      {platforms.map(({ key, label }) => {
        const url = SOCIAL_LINKS[key];
        if (!url) return null;
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="rounded-full border bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-gray-50"
          >
            {label} <span className="text-gray-400">↗</span>
          </a>
        );
      })}
    </div>
  );
}
