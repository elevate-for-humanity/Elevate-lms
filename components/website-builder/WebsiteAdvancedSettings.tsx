'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

function lines(value?: string[]) {
  return (value || []).join('\n');
}

function splitLines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

export function WebsiteAdvancedSettings({
  websiteId,
  initialConfig,
}: {
  websiteId: string;
  initialConfig: TenantSiteConfig;
}) {
  const [logoImage, setLogoImage] = useState(initialConfig.branding.logoImage || '');
  const [accentColor, setAccentColor] = useState(initialConfig.branding.accentColor || initialConfig.branding.primaryColor || '#1d4ed8');
  const [backgroundColor, setBackgroundColor] = useState(initialConfig.branding.backgroundColor || '#ffffff');
  const [textColor, setTextColor] = useState(initialConfig.branding.textColor || '#0f172a');
  const [heroImage, setHeroImage] = useState(initialConfig.homepage.heroImage || '');
  const [heroImageAlt, setHeroImageAlt] = useState(initialConfig.homepage.heroImageAlt || '');
  const [heroCtaHref, setHeroCtaHref] = useState(initialConfig.homepage.heroCtaHref || '');
  const [announcement, setAnnouncement] = useState(initialConfig.homepage.announcement || '');
  const [email, setEmail] = useState(initialConfig.contact?.email || initialConfig.footer.contactEmail || '');
  const [phone, setPhone] = useState(initialConfig.contact?.phone || '');
  const [address, setAddress] = useState(initialConfig.contact?.address || '');
  const [bookingUrl, setBookingUrl] = useState(initialConfig.contact?.bookingUrl || '');
  const [hours, setHours] = useState(lines(initialConfig.contact?.hours));
  const [footerDescription, setFooterDescription] = useState(initialConfig.footer.description || '');
  const [seoKeywords, setSeoKeywords] = useState((initialConfig.seo?.keywords || []).join(', '));
  const [testimonialQuote, setTestimonialQuote] = useState(initialConfig.testimonial?.quote || '');
  const [testimonialAuthor, setTestimonialAuthor] = useState(initialConfig.testimonial?.author || '');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'hero' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function uploadImage(kind: 'logo' | 'hero', file: File) {
    setUploading(kind); setMessage(''); setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', kind);
      const response = await fetch(`/api/apps/website-builder/sites/${websiteId}/assets`, {
        method: 'POST',
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not upload image');
      if (kind === 'logo') setLogoImage(data.url);
      else setHeroImage(data.url);
      setMessage(`${kind === 'logo' ? 'Logo' : 'Hero image'} uploaded. Save advanced settings to apply it.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload image');
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setBusy(true); setMessage(''); setError('');
    try {
      const response = await fetch(`/api/apps/website-builder/sites/${websiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteConfig: {
            branding: {
              ...initialConfig.branding,
              logoImage: logoImage.trim() || undefined,
              accentColor,
              backgroundColor,
              textColor,
            },
            homepage: {
              ...initialConfig.homepage,
              heroImage: heroImage.trim() || undefined,
              heroImageAlt: heroImageAlt.trim() || undefined,
              heroCtaHref: heroCtaHref.trim() || undefined,
              announcement: announcement.trim() || undefined,
            },
            contact: {
              email: email.trim() || undefined,
              phone: phone.trim() || undefined,
              address: address.trim() || undefined,
              bookingUrl: bookingUrl.trim() || undefined,
              hours: splitLines(hours),
            },
            footer: {
              ...initialConfig.footer,
              description: footerDescription.trim(),
              contactEmail: email.trim() || undefined,
            },
            seo: {
              ...initialConfig.seo,
              title: initialConfig.seo?.title || initialConfig.branding.logoText,
              description: initialConfig.seo?.description || '',
              keywords: seoKeywords.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 30),
            },
            testimonial: testimonialQuote.trim() && testimonialAuthor.trim()
              ? { quote: testimonialQuote.trim(), author: testimonialAuthor.trim() }
              : undefined,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save advanced settings');
      setMessage('Advanced website settings saved. Reloading the editor…');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save advanced settings');
      setBusy(false);
    }
  }

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <details className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <summary className="cursor-pointer text-lg font-black text-slate-950">Advanced site settings</summary>
          <p className="mt-2 text-sm text-slate-600">Manage uploaded media, contact details, booking, accessibility text, search keywords, and the additional brand fields supported by the published site.</p>
          {(message || error) ? <div className={`mt-4 rounded-xl border p-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || message}</div> : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-black text-slate-950">Brand & media</h2>
              <UploadField label="Logo image" kind="logo" currentUrl={logoImage} uploading={uploading} onUpload={uploadImage} />
              <Field label="Logo image URL" value={logoImage} onChange={setLogoImage} placeholder="Upload above or paste https://…" />
              <UploadField label="Hero image" kind="hero" currentUrl={heroImage} uploading={uploading} onUpload={uploadImage} />
              <Field label="Hero image URL" value={heroImage} onChange={setHeroImage} placeholder="Upload above or paste https://…" />
              <Field label="Hero image alt text" value={heroImageAlt} onChange={setHeroImageAlt} placeholder="Describe the image for accessibility" />
              <Field label="Hero button destination" value={heroCtaHref} onChange={setHeroCtaHref} placeholder="/contact or https://…" />
              <Field label="Announcement bar" value={announcement} onChange={setAnnouncement} placeholder="Optional announcement" />
              <div className="grid gap-3 sm:grid-cols-3">
                <ColorField label="Accent" value={accentColor} onChange={setAccentColor} />
                <ColorField label="Background" value={backgroundColor} onChange={setBackgroundColor} />
                <ColorField label="Text" value={textColor} onChange={setTextColor} />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-black text-slate-950">Contact & booking</h2>
              <Field label="Public email" value={email} onChange={setEmail} />
              <Field label="Phone" value={phone} onChange={setPhone} />
              <Field label="Address" value={address} onChange={setAddress} />
              <Field label="Booking URL" value={bookingUrl} onChange={setBookingUrl} placeholder="Google Calendar, Calendly, or booking page" />
              <TextArea label="Business hours — one line per entry" value={hours} onChange={setHours} rows={5} />
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-black text-slate-950">Trust & footer</h2>
              <TextArea label="Footer / About description" value={footerDescription} onChange={setFooterDescription} rows={5} />
              <TextArea label="Testimonial quote" value={testimonialQuote} onChange={setTestimonialQuote} rows={4} />
              <Field label="Testimonial author" value={testimonialAuthor} onChange={setTestimonialAuthor} />
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-black text-slate-950">Search keywords</h2>
              <TextArea label="SEO keywords — comma separated" value={seoKeywords} onChange={setSeoKeywords} rows={5} />
              <p className="text-xs leading-5 text-slate-500">The primary editor controls the SEO title and description. These keywords complete the search configuration used by the tenant metadata.</p>
            </div>
          </div>

          <button type="button" onClick={() => void save()} disabled={busy || Boolean(uploading)} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-50">
            {busy ? 'Saving…' : 'Save advanced settings'}
          </button>
        </details>
      </div>
    </section>
  );
}

function UploadField({ label, kind, currentUrl, uploading, onUpload }: { label: string; kind: 'logo' | 'hero'; currentUrl: string; uploading: 'logo' | 'hero' | null; onUpload: (kind: 'logo' | 'hero', file: File) => Promise<void> }) {
  function changed(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void onUpload(kind, file);
    event.target.value = '';
  }
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-700">{label}</p>
          <p className="text-xs text-slate-500">JPG, PNG, WebP or GIF · max 10 MB</p>
        </div>
        <label className="cursor-pointer rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-800 ring-1 ring-slate-300">
          {uploading === kind ? 'Uploading…' : 'Choose image'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={Boolean(uploading)} onChange={changed} />
        </label>
      </div>
      {currentUrl ? <p className="mt-2 truncate text-xs text-slate-400">{currentUrl}</p> : null}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950" /></label>;
}

function TextArea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950" /></label>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const safe = /^#[0-9a-f]{6}$/i.test(value) ? value : '#1d4ed8';
  return <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">{label}</span><div className="flex gap-2"><input type="color" value={safe} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 rounded border bg-white" /><input value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 rounded border border-slate-300 px-2 text-sm" /></div></label>;
}
