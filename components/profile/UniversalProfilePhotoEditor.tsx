'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, Upload } from 'lucide-react';
import { uploadProfileAvatar } from '@/lib/profile/avatar-actions';

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
    context.drawImage(
      source,
      (-source.naturalWidth * scale) / 2,
      (-source.naturalHeight * scale) / 2,
      source.naturalWidth * scale,
      source.naturalHeight * scale,
    );
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
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.88),
    );
    if (!blob) {
      setBusy(false);
      setMessage('Could not prepare that image.');
      return;
    }
    const result = await uploadProfileAvatar(
      new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' }),
    );
    setMessage(result.error || 'Profile photo saved.');
    setBusy(false);
    if (result.success) window.location.reload();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Camera className="h-6 w-6 text-blue-700" />
        <div>
          <h2 className="text-lg font-black text-slate-950">Profile photo</h2>
          <p className="text-sm text-slate-600">
            Choose, crop, and save a photo used across every dashboard.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-5 sm:grid-cols-[180px_1fr]">
        <div>
          {source ? (
            <canvas
              ref={canvasRef}
              className="aspect-square w-full rounded-2xl object-cover"
              aria-label="Profile photo preview"
            />
          ) : currentUrl ? (
            <img
              src={currentUrl}
              alt={`${name} profile`}
              className="aspect-square w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-100 text-5xl font-black text-slate-500">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 font-bold text-white">
            <Upload className="h-4 w-4" /> Choose photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => choose(event.target.files?.[0])}
            />
          </label>
          <p className="text-xs text-slate-600">
            JPG, PNG, or WebP. The saved image is optimized below the 2 MB storage limit.
          </p>
          {source ? (
            <>
              <label className="block text-sm font-bold">
                Crop / zoom
                <input
                  className="mt-1 w-full"
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((value) => value + 90)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 font-bold"
                >
                  <RotateCcw className="h-4 w-4" /> Rotate
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={busy}
                  className="min-h-11 rounded-xl bg-blue-700 px-5 font-black text-white disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Save photo'}
                </button>
              </div>
            </>
          ) : null}
          {message ? (
            <p role="status" aria-live="polite" className="text-sm font-bold text-slate-800">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
