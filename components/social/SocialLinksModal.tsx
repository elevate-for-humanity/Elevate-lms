'use client';

import { useEffect, useRef, useCallback } from 'react';
import { X, Facebook, Instagram, Linkedin, Youtube, ExternalLink } from 'lucide-react';
import { SOCIAL_LINKS } from '@/config/social-links';

interface SocialLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORMS = [
  {
    key: 'facebook' as const,
    label: 'Follow on Facebook',
    icon: Facebook,
    color: 'bg-[#1877F2] hover:bg-[#166FE5]',
    textColor: 'text-white',
    description: 'Daily updates, success stories, and community events',
  },
  {
    key: 'instagram' as const,
    label: 'Follow on Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90',
    textColor: 'text-white',
    description: 'Behind-the-scenes training and student spotlights',
  },
  {
    key: 'linkedin' as const,
    label: 'Connect on LinkedIn',
    icon: Linkedin,
    color: 'bg-[#0A66C2] hover:bg-[#004182]',
    textColor: 'text-white',
    description: 'Professional network, job opportunities, and employer connections',
  },
  {
    key: 'youtube' as const,
    label: 'Subscribe on YouTube',
    icon: Youtube,
    color: 'bg-[#FF0000] hover:bg-[#CC0000]',
    textColor: 'text-white',
    description: 'Training videos, program walkthroughs, and graduate stories',
  },
] as const;

export default function SocialLinksModal({ isOpen, onClose }: SocialLinksModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const modal = modalRef.current;
    if (!modal) return;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    modal.addEventListener('keydown', trap);
    return () => modal.removeEventListener('keydown', trap);
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="social-modal-title"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 pt-8 pb-6 text-center">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Brand mark */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 border border-white/20 mb-4">
            <span className="text-2xl font-black text-white">E</span>
          </div>

          <h2
            id="social-modal-title"
            className="text-xl font-bold text-white mb-2"
          >
            Stay Connected with Elevate
          </h2>
          <p className="text-sm text-white/75 leading-relaxed">
            Follow our mission to elevate communities through workforce training and career development.
          </p>
        </div>

        {/* Platform buttons */}
        <div className="p-6 space-y-3">
          {PLATFORMS.map(({ key, label, icon: Icon, color, textColor, description }) => {
            const url = SOCIAL_LINKS[key];
            if (!url) return null;

            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 ${color} ${textColor}`}
                aria-label={`${label} (opens in new tab)`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm leading-tight">{label}</p>
                  <p className="text-xs opacity-80 mt-0.5 leading-tight">{description}</p>
                </div>
                <ExternalLink className="w-4 h-4 opacity-60 flex-shrink-0" />
              </a>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-slate-400">
            Each link opens on that platform — follow at your own pace.
          </p>
        </div>
      </div>
    </div>
  );
}
