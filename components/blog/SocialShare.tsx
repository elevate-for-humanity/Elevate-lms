'use client';
import { logger } from '@/lib/logger';

import { Mail, Link2 } from 'lucide-react';
import { Facebook, Linkedin, Instagram, Share2 } from '../ui/BrandIcons';
import { useState } from 'react';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
}

export function SocialShare({ url, title, description }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || '');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-700 mr-2">Share:</span>

      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition"
        aria-label="Share on Facebook"
      >
        <Facebook className="w-5 h-5" />
      </a>

      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-blue-700 text-white hover:bg-brand-blue-800 transition"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="w-5 h-5" />
      </a>

      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-green-500 text-white hover:bg-brand-green-600 transition"
        aria-label="Share on Instagram"
      >
        <Instagram className="w-5 h-5" />
      </a>

      <a
        href="#"
        onClick={(e) => { e.preventDefault(); copyToClipboard(); }}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-500 text-white hover:bg-slate-600 transition"
        aria-label="Share"
      >
        <Share2 className="w-5 h-5" />
      </a>

      <a
        href={shareLinks.email}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-600 text-white hover:bg-slate-700 transition"
        aria-label="Share via Email"
      >
        <Mail className="w-5 h-5" />
      </a>

      <button
        onClick={copyToClipboard}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition ${
          copied ? 'bg-brand-green-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
        }`}
        aria-label="Copy link"
      >
        <Link2 className="w-5 h-5" />
      </button>

      {copied && <span className="text-sm text-brand-green-600 font-medium">Copied!</span>}
    </div>
  );
}
