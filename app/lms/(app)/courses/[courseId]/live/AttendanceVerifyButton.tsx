'use client';

import { useState, useRef } from 'react';
import { Camera, CheckCircle, Loader2, X } from 'lucide-react';

export function AttendanceVerifyButton({ meetingId }: { meetingId: string }) {
  const [open, setOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ verified: boolean; reason?: string; message?: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setResult({ verified: false, reason: 'Camera access denied' });
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function captureFrame(): string | null {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  }

  async function handleVerify() {
    const imageBase64 = captureFrame();
    if (!imageBase64) { setResult({ verified: false, reason: 'Could not capture image' }); return; }

    setVerifying(true);
    try {
      const res = await fetch('/api/attendance/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, imageBase64 }),
      });
      const data = await res.json().catch(() => ({}));
      setResult(data);
      stopCamera();
    } catch {
      setResult({ verified: false, reason: 'Network error — try again' });
    } finally {
      setVerifying(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    setResult(null);
    startCamera();
  }

  function handleClose() {
    stopCamera();
    setOpen(false);
    setResult(null);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <Camera className="w-4 h-4" /> Verify Attendance
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Attendance Verification</h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {result ? (
              <div className={`rounded-xl p-4 text-center ${result.verified ? 'bg-brand-green-50 border border-brand-green-200' : 'bg-red-50 border border-red-200'}`}>
                {result.verified
                  ? <CheckCircle className="w-10 h-10 text-brand-green-600 mx-auto mb-2" />
                  : <X className="w-10 h-10 text-red-500 mx-auto mb-2" />}
                <p className={`font-semibold ${result.verified ? 'text-brand-green-800' : 'text-red-700'}`}>
                  {result.verified ? 'Attendance Verified' : 'Verification Failed'}
                </p>
                {(result.reason || result.message) && (
                  <p className="text-sm text-slate-600 mt-1">{result.reason ?? result.message}</p>
                )}
                <button onClick={handleClose} className="mt-4 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg">
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-3">Position your face in the camera and click Verify.</p>
                <div className="rounded-xl overflow-hidden bg-slate-900 mb-4 aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full py-2.5 bg-brand-green-600 hover:bg-brand-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Verify'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
