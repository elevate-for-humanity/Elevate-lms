'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, FileSignature, RotateCcw, ShieldCheck, Upload } from 'lucide-react';
import {
  getImageReleaseStatus,
  revokeImageRelease,
  signImageRelease,
  uploadProfileAvatar,
} from '@/lib/profile/avatar-actions';
import { IMAGE_RELEASE_TEXT } from '@/lib/profile/image-release-constants';

type ReleaseStatus = {
  id: string;
  signed_name: string;
  signer_capacity: 'self' | 'parent_guardian';
  consent_scope: 'internal_only' | 'internal_and_public';
  signed_at: string;
} | null;

export function UniversalProfilePhotoEditor({
  currentUrl,
  name,
}: {
  currentUrl?: string | null;
  name: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [release, setRelease] = useState<ReleaseStatus>(null);
  const [releaseLoading, setReleaseLoading] = useState(true);
  const [releaseBusy, setReleaseBusy] = useState(false);
  const [participantName, setParticipantName] = useState(name);
  const [signedName, setSignedName] = useState('');
  const [signerCapacity, setSignerCapacity] = useState<'self' | 'parent_guardian'>('self');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [consentScope, setConsentScope] = useState<'internal_only' | 'internal_and_public'>('internal_and_public');
  const [acknowledged, setAcknowledged] = useState(false);
  const [releaseMessage, setReleaseMessage] = useState('');

  useEffect(() => {
    void getImageReleaseStatus().then((result) => {
      setRelease(result.consent ?? null);
      setReleaseMessage(result.error || '');
      setReleaseLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!source || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    const size = 420;
    canvas.width = size;
    canvas.height = size;
    context.clearRect(0, 0, size, size);
    context.save();
    context.translate(size / 2, size / 2);
    context.rotate((rotation * Math.PI) / 180);
    const scale = Math.max(size / source.naturalWidth, size / source.naturalHeight) * zoom;
    context.drawImage(source, (-source.naturalWidth * scale) / 2, (-source.naturalHeight * scale) / 2, source.naturalWidth * scale, source.naturalHeight * scale);
    context.restore();
  }, [rotation, source, zoom]);

  function choose(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Choose a JPG, PNG, or WebP photo.');
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setSource(image);
      URL.revokeObjectURL(url);
      setMessage('');
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setMessage('That image could not be opened. Choose a JPG, PNG, or WebP photo.');
    };
    image.src = url;
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    setBusy(true);
    setMessage('');
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (!blob) {
      setBusy(false);
      setMessage('Could not prepare that image.');
      return;
    }
    const result = await uploadProfileAvatar(new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' }));
    setMessage(result.error || 'Profile photo saved.');
    setBusy(false);
    if (result.success) window.location.reload();
  }

  async function signRelease() {
    if (!acknowledged) {
      setReleaseMessage('Read and acknowledge the release before signing.');
      return;
    }
    setReleaseBusy(true);
    setReleaseMessage('');
    const result = await signImageRelease({
      participantName,
      signedName,
      signerCapacity,
      guardianRelationship,
      consentScope,
    });
    if (result.error) {
      setReleaseMessage(result.error);
    } else {
      const refreshed = await getImageReleaseStatus();
      setRelease(refreshed.consent ?? null);
      setReleaseMessage('Image release signed and saved.');
    }
    setReleaseBusy(false);
  }

  async function revokeRelease() {
    setReleaseBusy(true);
    const result = await revokeImageRelease();
    setReleaseMessage(result.error || 'Image release revoked for future public use.');
    if (!result.error) setRelease(null);
    setReleaseBusy(false);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Camera className="h-6 w-6 text-blue-700" />
          <div>
            <h2 className="text-lg font-black text-slate-950">Profile photo</h2>
            <p className="text-sm text-slate-600">Choose, crop, and save a photo used across every dashboard.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-[180px_1fr]">
          <div>
            {source ? (
              <canvas ref={canvasRef} className="aspect-square w-full rounded-2xl object-cover" aria-label="Profile photo preview" />
            ) : currentUrl ? (
              <img src={currentUrl} alt={`${name} profile`} className="aspect-square w-full rounded-2xl object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-100 text-5xl font-black text-slate-500">
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 font-bold text-white">
              <Upload className="h-4 w-4" /> Choose photo
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => choose(event.target.files?.[0])} />
            </label>
            <p className="text-xs text-slate-600">JPG, PNG, or WebP. The saved image is optimized below the 2 MB storage limit.</p>
            {source ? (
              <>
                <label className="block text-sm font-bold">
                  Crop / zoom
                  <input className="mt-1 w-full" type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setRotation((value) => value + 90)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 font-bold">
                    <RotateCcw className="h-4 w-4" /> Rotate
                  </button>
                  <button type="button" onClick={() => void save()} disabled={busy} className="min-h-11 rounded-xl bg-blue-700 px-5 font-black text-white disabled:opacity-50">
                    {busy ? 'Saving…' : 'Save photo'}
                  </button>
                </div>
              </>
            ) : null}
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              Uploading a profile photo does not grant permission for public marketing use. Public use requires the separate release below.
            </p>
            {message ? <p role="status" aria-live="polite" className="text-sm font-bold text-slate-800">{message}</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          {release ? <ShieldCheck className="h-6 w-6 text-emerald-700" /> : <FileSignature className="h-6 w-6 text-blue-700" />}
          <div>
            <h2 className="text-lg font-black text-slate-950">Image release</h2>
            <p className="text-sm text-slate-600">Control whether Elevate may use your image outside your private account.</p>
          </div>
        </div>

        {releaseLoading ? (
          <p className="mt-4 text-sm text-slate-600">Loading release status…</p>
        ) : release ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-black text-emerald-950">Signed</p>
            <p className="mt-1 text-sm text-emerald-900">
              {release.consent_scope === 'internal_and_public' ? 'Internal and public program use authorized.' : 'Internal dashboard use only.'}
            </p>
            <p className="mt-1 text-xs text-emerald-800">
              Signed by {release.signed_name} on {new Date(release.signed_at).toLocaleDateString('en-US')}.
            </p>
            <button type="button" onClick={() => void revokeRelease()} disabled={releaseBusy} className="mt-4 min-h-11 rounded-xl border border-red-300 bg-white px-4 font-bold text-red-700 disabled:opacity-50">
              Revoke future public use
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{IMAGE_RELEASE_TEXT}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold">Participant name
                <input value={participantName} onChange={(event) => setParticipantName(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" />
              </label>
              <label className="text-sm font-bold">Signer’s full legal name
                <input value={signedName} onChange={(event) => setSignedName(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" />
              </label>
              <label className="text-sm font-bold">I am signing as
                <select value={signerCapacity} onChange={(event) => setSignerCapacity(event.target.value as 'self' | 'parent_guardian')} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3">
                  <option value="self">Myself</option>
                  <option value="parent_guardian">Parent or legal guardian</option>
                </select>
              </label>
              {signerCapacity === 'parent_guardian' ? (
                <label className="text-sm font-bold">Relationship to participant
                  <input value={guardianRelationship} onChange={(event) => setGuardianRelationship(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" />
                </label>
              ) : null}
              <label className="text-sm font-bold">Permission
                <select value={consentScope} onChange={(event) => setConsentScope(event.target.value as 'internal_only' | 'internal_and_public')} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3">
                  <option value="internal_and_public">Internal and public program use</option>
                  <option value="internal_only">Private dashboard use only</option>
                </select>
              </label>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm font-semibold">
              <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4" />
              I have read the release, understand the selected permission, and electronically sign using the legal name entered above.
            </label>
            <button type="button" onClick={() => void signRelease()} disabled={releaseBusy || !acknowledged} className="min-h-11 rounded-xl bg-blue-700 px-5 font-black text-white disabled:opacity-50">
              {releaseBusy ? 'Saving…' : 'Sign image release'}
            </button>
          </div>
        )}
        {releaseMessage ? <p role="status" aria-live="polite" className="mt-3 text-sm font-bold text-slate-800">{releaseMessage}</p> : null}
      </section>
    </div>
  );
}
