import { Facebook, Instagram, Linkedin, Youtube } from '../ui/BrandIcons';
import { SOCIAL_LINKS } from '@/config/social-links';

export function SocialLinks() {
  return (
    <div className="hidden xl:flex items-center gap-3">
      <a
        href={SOCIAL_LINKS.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-700 hover:text-brand-blue-600 transition"
        aria-label="Facebook"
      >
        <Facebook className="w-5 h-5" />
      </a>
      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-700 hover:text-brand-blue-600 transition"
        aria-label="Instagram"
      >
        <Instagram className="w-5 h-5" />
      </a>
      <a
        href={SOCIAL_LINKS.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-700 hover:text-brand-blue-600 transition"
        aria-label="LinkedIn"
      >
        <Linkedin className="w-5 h-5" />
      </a>
      <a
        href={SOCIAL_LINKS.youtube}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-700 hover:text-brand-blue-600 transition"
        aria-label="YouTube"
      >
        <Youtube className="w-5 h-5" />
      </a>
    </div>
  );
}
