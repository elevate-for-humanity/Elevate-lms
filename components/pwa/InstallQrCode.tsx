'use client';

import { useEffect, useState } from 'react';

export function InstallQrCode({ path, label }: { path: string; label: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let active = true;
    void import('qrcode').then((QRCode) =>
      QRCode.toDataURL(new URL(path, window.location.origin).toString(), {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
      }).then((url: string) => { if (active) setSrc(url); }),
    ).catch(() => setSrc(''));
    return () => { active = false; };
  }, [path]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
      <h2 className="text-lg font-black text-slate-950">Scan to install on your phone</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Scan this code with your phone camera. It opens the {label} install page—not a generic dashboard.</p>
      {src ? <img src={src} alt={`QR code to install the Elevate ${label} app`} className="mx-auto mt-4 h-56 w-56 rounded-xl" /> : <div className="mx-auto mt-4 flex h-56 w-56 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-500">Preparing QR code…</div>}
      <p className="mt-3 break-all text-xs font-semibold text-slate-500">{path}</p>
    </div>
  );
}
