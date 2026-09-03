'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, Upload } from 'lucide-react';

type Props = {
  logoUrl?: string | null;
  flyerUrl?: string | null;
  publicProfileUrl?: string | null;
};

export default function HostShopPublicMediaForm({ logoUrl, flyerUrl, publicProfileUrl }: Props) {
  const [logo, setLogo] = useState(logoUrl || '');
  const [flyer, setFlyer] = useState(flyerUrl || '');
  const [busy, setBusy] = useState<'logo' | 'flyer' | null>(null);
  const [message, setMessage] = useState('');

  async function upload(kind: 'logo' | 'flyer', file?: File) {
    if (!file) return;
    setBusy(kind);
    setMessage('');
    try {
      const form = new FormData();
      form.set('kind', kind);
      form.set('file', file);
      const response = await fetch('/api/host-shop/profile-media', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Upload failed.');
      if (kind === 'logo') setLogo(data.url); else setFlyer(data.url);
      setMessage(`${kind === 'logo' ? 'Logo' : 'Flyer'} published successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-black text-slate-950">Public Host Shop media</h2>
          <p className="mt-1 text-sm text-slate-600">Upload your shop logo and optional flyer. Approved Host Shops publish these directly to the public website profile.</p>
        </div>
        {publicProfileUrl ? <a href={publicProfileUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">View public profile</a> : null}
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <MediaCard title="Shop logo" url={logo} kind="logo" busy={busy} onUpload={upload} />
        <MediaCard title="Shop flyer" url={flyer} kind="flyer" busy={busy} onUpload={upload} />
      </div>
      {message ? <p className="mt-4 text-sm font-semibold text-slate-700">{message}</p> : null}
    </section>
  );
}

function MediaCard({ title, url, kind, busy, onUpload }: {
  title: string;
  url: string;
  kind: 'logo' | 'flyer';
  busy: 'logo' | 'flyer' | null;
  onUpload: (kind: 'logo' | 'flyer', file?: File) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-black text-slate-950">{title}</p>
      {url ? <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-lg border bg-white"><Image src={url} alt={title} fill sizes="50vw" className="object-contain p-2" /></div> : <div className="mt-3 flex aspect-[16/9] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-500">No image uploaded</div>}
      <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-brand-blue-700 px-4 py-2 text-sm font-black text-white">
        {busy === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy === kind ? 'Uploading…' : `Upload ${title.toLowerCase()}`}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={busy !== null} onChange={(event) => onUpload(kind, event.target.files?.[0])} />
      </label>
    </div>
  );
}
