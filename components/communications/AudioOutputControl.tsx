'use client';
import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
type OutputAudio = HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
export function AudioOutputControl({ audio }: { audio: RefObject<HTMLAudioElement | null> }) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [selected, setSelected] = useState('default'),
    [error, setError] = useState('');
  async function refresh() {
    try {
      if (!navigator.mediaDevices?.enumerateDevices)
        throw Error('Audio devices are managed by this phone’s system settings.');
      setDevices(
        (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audiooutput'),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Audio devices unavailable.');
    }
  }
  useEffect(() => {
    void refresh();
    navigator.mediaDevices?.addEventListener?.('devicechange', refresh);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', refresh);
  }, []);
  async function choose(id: string) {
    try {
      const player = audio.current as OutputAudio | null;
      if (!player) throw Error('Audio player unavailable.');
      player.muted = false;
      if (player.volume === 0) player.volume = 1;
      if (player.setSinkId) await player.setSinkId(id);
      else if (id !== 'default')
        throw Error(
          'Choose the speaker or paired Bluetooth headset in your phone’s audio-output controls.',
        );
      setSelected(id);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Audio output could not be changed.');
    }
  }
  async function headset() {
    try {
      const media = navigator.mediaDevices as MediaDevices & {
        selectAudioOutput?: () => Promise<MediaDeviceInfo>;
      };
      if (media?.selectAudioOutput) {
        const device = await media.selectAudioOutput();
        setDevices((current) => [...current.filter((d) => d.deviceId !== device.deviceId), device]);
        await choose(device.deviceId);
      } else {
        await refresh();
        setError(
          'Select your paired headset below. If it is not listed, select it in your phone’s Bluetooth/audio settings.',
        );
      }
    } catch {
      setError('Audio-output selection was cancelled or unavailable.');
    }
  }
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-slate-300 bg-white p-3 text-slate-900">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            void choose(devices.find((d) => /speaker/i.test(d.label))?.deviceId || 'default')
          }
          className="min-h-11 rounded-lg border px-3 font-bold"
        >
          Speaker / default audio
        </button>
        <button
          type="button"
          onClick={() => void headset()}
          className="min-h-11 rounded-lg border px-3 font-bold"
        >
          Bluetooth / headset
        </button>
        <button
          type="button"
          onClick={() => void refresh()}
          className="min-h-11 rounded-lg border px-3 font-bold"
        >
          Refresh devices
        </button>
      </div>
      <label className="block text-sm font-bold">
        Audio output
        <select
          aria-label="Audio output"
          value={selected}
          onChange={(e) => void choose(e.target.value)}
          className="ml-2 max-w-full rounded border p-2"
        >
          <option value="default">System default</option>
          {devices
            .filter((d) => d.deviceId !== 'default')
            .map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Audio output ${i + 1}`}
              </option>
            ))}
        </select>
      </label>
      {error && (
        <p role="status" className="text-sm text-amber-900">
          {error}
        </p>
      )}
    </div>
  );
}
