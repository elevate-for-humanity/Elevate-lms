'use client';

import { useEffect, useState } from 'react';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import {
  FOOTER_SOCIAL_ICONS,
  MAX_FOOTER_SOCIAL_LINKS,
  validateFooterPresentationFields,
} from '@/lib/tenant/footer-presentation';

export function WebsiteFooterPresentationEditor({
  config,
  busy,
  onSave,
}: {
  config: TenantSiteConfig;
  busy: boolean;
  onSave: (next: TenantSiteConfig) => Promise<unknown>;
}) {
  const [footer, setFooter] = useState(config.footer);
  const [error, setError] = useState('');
  useEffect(() => {
    setFooter(config.footer);
    setError('');
  }, [config.footer]);
  const links = footer.socialLinks || [];
  async function save() {
    const issues = validateFooterPresentationFields({ footer });
    if (issues.length) {
      setError(issues[0].message);
      return;
    }
    setError('');
    await onSave({
      ...config,
      footer: {
        ...config.footer,
        showLogo: footer.showLogo,
        layout: footer.layout,
        socialLinks: links,
      },
    });
  }
  return (
    <details className="mt-4 rounded-xl border border-slate-200 p-4">
      <summary className="min-h-11 cursor-pointer font-bold">
        Footer brand and social profiles
      </summary>
      <p className="my-3 text-sm text-slate-500">
        Use your saved brand logo and social profile URLs you have approved for this website.
      </p>
      <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
        <input
          type="checkbox"
          disabled={busy}
          checked={footer.showLogo === true}
          onChange={(event) => setFooter({ ...footer, showLogo: event.target.checked })}
        />
        Show saved brand logo in footer
      </label>
      <label className="mt-3 block text-sm font-bold">
        Footer arrangement
        <select
          className="mt-1 block min-h-11 w-full rounded border p-2"
          disabled={busy}
          value={footer.layout || 'stacked'}
          onChange={(event) =>
            setFooter({ ...footer, layout: event.target.value as 'stacked' | 'columns' })
          }
        >
          <option value="stacked">Brand above links</option>
          <option value="columns">Brand beside link columns</option>
        </select>
      </label>
      {links.map((link, index) => (
        <fieldset key={index} className="mt-4 min-w-0 rounded border p-3">
          <legend>Social profile {index + 1}</legend>
          <label className="block text-sm font-bold">
            Profile label
            <input
              className="mt-1 block min-h-11 w-full rounded border p-2"
              disabled={busy}
              maxLength={80}
              value={link.label}
              onChange={(event) =>
                setFooter({
                  ...footer,
                  socialLinks: links.map((item, at) =>
                    at === index ? { ...item, label: event.target.value } : item,
                  ),
                })
              }
            />
          </label>
          <label className="mt-3 block text-sm font-bold">
            Profile HTTPS URL
            <input
              className="mt-1 block min-h-11 w-full rounded border p-2"
              type="url"
              disabled={busy}
              maxLength={2048}
              value={link.url}
              onChange={(event) =>
                setFooter({
                  ...footer,
                  socialLinks: links.map((item, at) =>
                    at === index ? { ...item, url: event.target.value } : item,
                  ),
                })
              }
            />
          </label>
          <label className="mt-3 block text-sm font-bold">
            Profile display
            <select
              className="mt-1 block min-h-11 w-full rounded border p-2"
              disabled={busy}
              value={link.icon || ''}
              onChange={(event) =>
                setFooter({
                  ...footer,
                  socialLinks: links.map((item, at) =>
                    at === index
                      ? {
                          ...item,
                          icon: event.target.value
                            ? (event.target.value as NonNullable<typeof link.icon>)
                            : undefined,
                        }
                      : item,
                  ),
                })
              }
            >
              <option value="">Text label</option>
              {FOOTER_SOCIAL_ICONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="mt-2 min-h-11 p-2"
            disabled={busy}
            onClick={() =>
              setFooter({ ...footer, socialLinks: links.filter((_, at) => at !== index) })
            }
          >
            Remove social profile {index + 1}
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="mt-3 min-h-11 p-2 font-bold"
        disabled={busy || links.length >= MAX_FOOTER_SOCIAL_LINKS}
        onClick={() => setFooter({ ...footer, socialLinks: [...links, { label: '', url: '' }] })}
      >
        Add social profile
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="mt-3 min-h-11 rounded border p-3 font-bold"
        disabled={busy}
        onClick={() => void save()}
      >
        Save footer presentation
      </button>
    </details>
  );
}
