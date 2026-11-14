'use client';

import { useEffect, useRef, useState } from 'react';

/** Local-only preview: permission is requested on click and tracks stop on close/unmount. */
export function MeetingDeviceCheck() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const [status, setStatus] = useState('');
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [screenSupported, setScreenSupported] = useState(false);

  function stopPreview() {
    requestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }
  useEffect(() => {
    setScreenSupported(Boolean(navigator.mediaDevices?.getDisplayMedia));
    return stopPreview;
  }, []);

  async function preview(kind: 'camera' | 'screen') {
    stopPreview();
    setError('');
    setStatus('');
    setActive(false);
    setPending(true);
    const request = requestRef.current;
    try {
      if (!navigator.mediaDevices)
        throw new Error('Use a supported browser with a secure connection.');
      const stream =
        kind === 'camera'
          ? await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
          : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      if (request !== requestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      stream.getVideoTracks()[0]?.addEventListener(
        'ended',
        () => {
          if (streamRef.current !== stream) return;
          stopPreview();
          setActive(false);
          setStatus('Preview stopped.');
        },
        { once: true },
      );
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      setStatus(
        kind === 'camera'
          ? 'Camera preview is on and microphone access is allowed. This local check is muted; confirm sound with your meeting participant.'
          : 'Screen preview is on. Only you can see this preview. Join a meeting to present to participants.',
      );
    } catch {
      if (request !== requestRef.current) return;
      stopPreview();
      setActive(false);
      setError(
        'Preview did not start. Check browser camera/microphone permissions or choose a screen, then try again.',
      );
    } finally {
      if (request === requestRef.current || streamRef.current === null) setPending(false);
    }
  }

  return (
    <details
      onToggle={(event) => {
        if (!event.currentTarget.open) {
          stopPreview();
          setActive(false);
          setPending(false);
          setStatus('');
        }
      }}
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      <summary className="min-h-11 cursor-pointer text-lg font-bold">
        Check camera, microphone and screen sharing
      </summary>
      <p className="mt-3 text-sm text-slate-600">
        Test on the device you will use. The preview stays on your device and does not create a
        meeting or recording.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => void preview('camera')}
          className="min-h-12 rounded-xl bg-blue-800 px-4 py-3 font-bold text-white disabled:opacity-50"
        >
          Test camera and microphone
        </button>
        <button
          type="button"
          disabled={pending || !screenSupported}
          onClick={() => void preview('screen')}
          className="min-h-12 rounded-xl border border-slate-300 px-4 py-3 font-bold disabled:opacity-50"
        >
          Test screen sharing
        </button>
        {active && (
          <button
            type="button"
            onClick={() => {
              stopPreview();
              setActive(false);
              setStatus('Preview stopped.');
            }}
            className="min-h-12 rounded-xl border border-slate-300 px-4 py-3 font-bold"
          >
            Stop preview
          </button>
        )}
      </div>
      {!screenSupported && (
        <p className="mt-3 text-sm text-slate-600">
          This browser cannot present a screen. Use a supported desktop browser to share.
        </p>
      )}
      {pending && (
        <p role="status" className="mt-3 text-sm">
          Waiting for your device permission…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-red-800">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="mt-3 text-sm">
          {status}
        </p>
      )}
      <video
        ref={videoRef}
        muted
        playsInline
        className={`mt-4 aspect-video max-h-64 w-full rounded-xl bg-slate-950 object-contain ${active ? '' : 'hidden'}`}
        aria-label="Local device preview"
      />
    </details>
  );
}
