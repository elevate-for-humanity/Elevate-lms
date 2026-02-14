"use client";

import React from 'react';

import { useState } from 'react';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
}

export function SocialShare({ url, title, description }: SocialShareProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + url : url;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || '');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
      } catch (error) { /* Error handled silently */ 
        // Error: $1
      }
    } else {
      setShowMenu(!showMenu);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black rounded-lg transition"
        aria-label="Share"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-medium">Share</span>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Share Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 p-4">
            <h3 className="text-sm font-semibold text-black mb-3">Share this</h3>

            <div className="space-y-2">
              {/* Facebook */}
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-brand-blue-600 rounded-lg flex items-center justify-center">
                  <Facebook className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-black">Facebook</span>
              </a>

              <a
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center" />
              </a>

              {/* LinkedIn */}
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-brand-blue-700 rounded-lg flex items-center justify-center">
                  <Linkedin className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-black">LinkedIn</span>
              </a>

              {/* Email */}
              <a
                href={shareLinks.email}
                className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-black">Email</span>
              </a>

              {/* Copy Link */}
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition w-full"
              >
                <div className="w-8 h-8 bg-brand-orange-600 rounded-lg flex items-center justify-center">
                  {copied ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <LinkIcon className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-black">
                  {copied ? 'Copied!' : 'Copy Link'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
